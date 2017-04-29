const matrixTranspose = m => {
	if (m[0] instanceof Array) {
			let ret = m[0].map((x,i) => m.map(x => x[i]));
			if (ret.length === 1)
				return ret[0];
			else 
				return ret;
		}
	else
		return m.map(e => [e]);
}

export function solveMatrixGame(matrix, maxIterations, precision) {
	// transpose because I treat player 2 strategies across the top for this method
	const payoffMatrix = matrixTranspose(matrix);

	// initialize A with top right notation
	let A = [['A']]; 

	for (let i = 1; i <= payoffMatrix.length + 1; i++) {
		// push y-vars into matrix
		A = [...A, [`S${i}`]];
	}

	for (let i = 1; i < payoffMatrix.length + 1; i++) {
		for (let j = 1; j <= payoffMatrix[i - 1].length; j++) {
		// insert matrix elements from payoff matrix
			A[i][j] = payoffMatrix[i - 1][j - 1];
		}
	}

	for (let i = 1; i < payoffMatrix.length + 1; i++) {
		// append primal value
		A[i] = [...A[i], 1];
	}

	for (let j = 1; j <= payoffMatrix[0].length + 1; j++) {
		// push on x vars
		A[0][j] = `T${j}`;

		// append dual values
		A[payoffMatrix.length + 1] = [...A[payoffMatrix.length + 1], -1];
	}

	// apply the d into the tableau (1 / V)
	A[payoffMatrix.length + 1][payoffMatrix[0].length + 1] = 0;

	console.log("Tableau: (before)");
	debugLogMatrix(A);

	// find the smallest value in the first row via linear search
	let smallestValue = A[1][1];
	for (let j = 2; j < payoffMatrix[0].length + 1; j++) {
		let s = A[1][j];
		if (smallestValue > s) 
			smallestValue = s;
	}

	// force the first row positive (> 0), applying to the entire matrix. 
	// guarantees that there will be no divide by 0 errors calculating d
	smallestValue--;
	for (let i = 1; i < payoffMatrix.length + 1; i++) {
		for (let j = 1; j < payoffMatrix[0].length + 1; j++) {
			A[i][j] = A[i][j] - smallestValue;
		}
	}

	// pivot location, q = 1 can be assumed because it is forced to be -1 from setup of A
	let p = 0, q = 1

	// do not iterate infinitely
	let maxPivots = maxIterations;

	// while there exists a column to pivot on...
	while (q != 0 && maxPivots > 0) {
		// take away a pivot, too many pivots results in non-result
		maxPivots --;

		// find pivot row
		let r = 0;
		for (let i = 1; i < payoffMatrix.length + 1; i++) {
			// select an element
			let temp = A[i][q];

			// is it positive? (Simplex Method step 4)
			if (temp > 0) {
				let temp2 = A[i][payoffMatrix[0].length + 1];

				// if the ratio is smaller
				if (temp > temp2 * r) {
					// set pivot row and new ratio
					p = i;
					r = temp / temp2;
				}
			}
		}

		// row pivot on p
		let d = A[p][q];
		for (let j = 1; j < payoffMatrix[0].length + 2; j++) {
			// skip the pivot column
			if (j == q) continue;

			// R / P
			A[p][j] = A[p][j] / d;
		}

		// tableau pivot everywhere but (p,q)
		for (let i = 1; i <= payoffMatrix.length + 1; i++) {
			// skip pivot row
			if (i == p)  continue;

			for (let j = 1; j <= payoffMatrix[0].length + 1; j++) {
				// skip current col
				if (j == q) continue;
				
				// G - RC / P (A[p][j] will already be divided by P)
				A[i][j] = A[i][j] - A[i][q] * A[p][j];
			}
		}

		// column pivot on q
		for (let i = 1; i <= payoffMatrix.length + 1; i++) {
			// skip pivot row
			if (i == p) continue;

			// - C / P
			A[i][q] = -A[i][q] / d;
		}

		// 1 / P
		A[p][q] = 1.0 / d;

		// swap x/y variables
		let temp = A[p][0];
		A[p][0] = A[0][q];
		A[0][q] = temp;

		// find pivot column, set q to 'row not found' (condition at the beginning of the loop)
		q = 0;
		for (let j = 1; j < payoffMatrix[0].length + 1; j++) {
			// find the first negative dual value
			if (A[payoffMatrix.length + 1][j] < 0) {
				q = j;
				break;
			}
		}
	}

	// determine the optimal mixed strategies from the matrix, start with empty strategies
	let x = [], y = [];
	for (let i = 0; i <= payoffMatrix.length; i++) {
		x = [...x, 0];
	}
	for (let i = 0; i <= payoffMatrix[0].length; i++) {
		y = [...y, 0];
	}

	// number formatter
	const formatNumber = e => Number(Math.abs(e) < precision ? 0 : e).toPrecision(6);

	// figure out index form variable name string via regex
	const getIndex = e => Number(e.replace(/(T|S)/, e => ''));
	
	// minimization target 1 / V inverted to get actual value
	let val = 1.0 / A[payoffMatrix.length + 1][payoffMatrix[0].length + 1];
	if (maxPivots > 0) {

		// player 2 strategy values
		for (let j = 1; j < payoffMatrix[0].length + 1; j++) {

			// extract the subscript of the variable
			let index = getIndex(A[0][j]);

			// is it a basic y-var?
			if (A[0][j].indexOf('S') != -1) {
				// apply it to the solution set, restore the divide by V from earlier
				x[index] = A[payoffMatrix.length + 1][j] * val;
			}
		}

		// player 1 strategy values
		for (let i = 1; i < payoffMatrix.length + 1; i++) {

			// extract the subscript of the variable
			let index = getIndex(A[i][0])

			// is it a non-basic x-var?
			if (A[i][0].indexOf('T') != -1) {
				// apply it to the solution set, restore the divide by V from earlier
				y[index] = A[i][payoffMatrix[0].length + 1] * val;
			}
		}

		// formatting to fixed length string
		x = x.map(formatNumber)
		y = y.map(formatNumber)
	} else {
		// not solved in time, return something to display
		x = x.map(e => '###');
		y = y.map(e => '###');
	}

	// pop off dummy value at index 0 (never touched)
	x.shift();
	y.shift();

	console.log("Tableau: (after)");
	debugLogMatrix(A);

	// reapply the smallestValue subtracted earlier
	let gameValue = formatNumber(val + smallestValue);

	// return all information
	return [x, y, gameValue];
}

// debugging tool to pretty-print matrices and tableaus
function debugLogMatrix(m) {
	for (let i = 0; i < m.length; i ++) {
		if (m[i] instanceof Array) {
			console.log(m[i].reduce((e, p) => `${e}\t\t${p}`));
		} else {
			console.log(m[i].map(e => `\t\t${e}`));
		}
	}
}
