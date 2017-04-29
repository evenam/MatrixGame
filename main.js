import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { solveMatrixGame } from './matrixGame';

// modify as necessary
const matrixLimit = { max: 10, min: 2 };

// apply a solve and return the solved state
function solve(state) {
	// exit early if the matrix is incomplete
	let earlyexit = false;
	for (let i = 0; i < state.data.length && !earlyexit; i++) {
		for (let j = 0; j < state.data[i].length && !earlyexit; j++) {
			// not all values are filled out?
			if (isNaN(Number(state.data[i][j])))
				earlyexit = true;
		}
	}

	// shove in some 'data' to show if the matrix is incomplete
	if (earlyexit) {
		// blank strategues
		let p1s = [];
		for (let i = 0; i < state.data[0].length; i++)
			p1s = [...p1s, '###'];
		let p2s = [];
		for (let i = 0; i < state.data.length; i++)
			p2s = [...p2s, '###'];

		// new state
		let newState = {
			m: state.m,
			n: state.n,
			data: state.data,
			p1s: p2s,
			p2s: p1s
		};

		return newState;
	} else {

		// solve the system via matrixGame.js
		let solution = solveMatrixGame(state.data, state.m * state.n, 0.000001);

		// return the solution in the state
		let newState = {
			m: state.m,
			n: state.n,
			data: state.data,
			p1s: solution[0],
			p2s: solution[1],
			val: solution[2]
		};

		return newState;
	}
}

function reducer(state = { 
		// default data
		m: 2, n: 2,
		data: [ [ 1, -1 ], [ -1, 1 ] ],
		p1s: [ "0.500000", "0.500000" ],
		p2s: [ "0.500000", "0.500000" ],
		val: 0
	}, action) {
	// assume state is solved, always return a solved state
	switch (action.type) {
		// increment the columns if we havent hit the max and solve the matrix
		case 'P1_INC':
			if (state.n < matrixLimit.max)
				return solve({
					m: state.m,
					n: state.n + 1,
					data: state.data.map(e => [...e, 0])
				});
			else return state;
		// decrement the columns if we havent hit the min and solve the matrix
		case 'P1_DEC':
			if (state.n > matrixLimit.min)
				return solve({
					m: state.m,
					n: state.n - 1,
					data: state.data.map(e => { e.pop(); return [...e]; })
				});
			else return state;
		// increment the rows if we havent hit the max and solve the matrix
		case 'P2_INC':
			if (state.m < matrixLimit.max)
				return solve({
					m: state.m + 1,
					n: state.n,
					data: (e => { e.push(e[e.length - 1]); e[e.length - 1] = e[e.length - 1].map(e => 0); return e; })(state.data)
				});
			else return state;
		// decrement the rows if we havent hit the min and solve the matrix
		case 'P2_DEC':
			if (state.m > matrixLimit.min)
				return solve({
					m: state.m - 1,
					n: state.n,
					data: (e => { e.pop(); return e })(state.data)
				});
			else return state;
		// matrix has changed, solve the system
		case 'MATRIX_MOD': 
			let newState = {
				data: [...state.data],
				m: state.m,
				n: state.n
			};
			newState.data[action.i][action.j] = action.data;
			return solve(newState);
		// default case
		default: return state;
	}
}

const gameSize = (state) => {
	// container to hold the strategy size chooser
	return (<div> 
		<h2>Strategy Sets</h2>
		<div>
			<label>Player 1 Strategies (<i>n</i>)</label>
			<div>
				<button onClick={(e) => store.dispatch({ type: 'P1_INC'})}>+</button>
				<span>{state.n}</span>
				<button onClick={(e) => store.dispatch({ type: 'P1_DEC'})}>-</button>
			</div>
		</div>
		<div>
			<label>Player 2 Strategies (<i>m</i>)</label>
			<div>
				<button onClick={(e) => store.dispatch({ type: 'P2_INC'})}>+</button>
				<span>{state.m}</span>
				<button onClick={(e) => store.dispatch({ type: 'P2_DEC'})}>-</button>
			</div>
		</div>
	</div>)
}

const matrixEntry = (state) => {
	// creates a table with text box entries
	let table = [];
	table.push([<td>P2\P1</td>]);
	for (let j = 0; j < state.data[0].length; j++) {
		table[0].push(<td>{`S${j + 1}`}</td>);
	}
	for (let i = 0; i < state.data.length; i++) {
		table.push([]);
		table[i + 1].push(`T${i + 1}`);
		for (let j = 0; j < state.data[i].length; j++) {
			table[i + 1].push(`${state.data[i][j]}`);
		}

		var x = i - 1;
		table[i + 1] = table[i + 1].map((e, j) => {
			// weird notation for holding ai and aj constant by using a function returning a function anc calling it immediately
			let onChangeFunc = ((ai, aj) => 
					(e) => store.dispatch({ type: 'MATRIX_MOD', data: e.target.value, i: ai, j: aj })
				)(x + 1, j - 1);
			if (j === 0) 
				return <td>{e}</td>
			else 
				return<td><input type="text" value={e} onChange={onChangeFunc} /></td>
		});
	}

	// wrap the rows
	table = table.map(e => <tr>{e}</tr>);

	// return the table
	return (<div>
		<h2>Payoff Matrix</h2>
		<table>
			<tbody>
			{table}
			</tbody>
		</table>
	</div>)
}

const solutionSet = (state) => {
	// create table of strategy variables and values for player 1
	let table1 = [[], []];
	for (let i = 0; i < state.p1s.length; i++) {
		table1[0].push(`S${i + 1}`);
		table1[1].push(`${state.p1s[i]}`);
	}

	table1[0] = table1[0].map(e => <td>{e}</td>);
	table1[1] = table1[1].map(e => <td>{e}</td>);
	table1[0] = <tr>{table1[0]}</tr>;
	table1[1] = <tr>{table1[1]}</tr>;

	// create table of strategy variables and values for player 2
	let table2 = [[], []];
	for (let i = 0; i < state.p2s.length; i++) {
		table2[0].push(`T${i + 1}`);
		table2[1].push(`${state.p2s[i]}`);
	}

	table2[0] = table2[0].map(e => <td>{e}</td>);
	table2[1] = table2[1].map(e => <td>{e}</td>);
	table2[0] = <tr>{table2[0]}</tr>;
	table2[1] = <tr>{table2[1]}</tr>;

	// render the table
	return (<div>
		<h2>Optimal Solutions</h2>
		<table>
			<thead>
				<tr><td><h4>Player 1</h4></td></tr>
			</thead>
			<tbody>
				{table1[0]}
				{table1[1]}
			</tbody>
		</table>
		<table>
			<thead>
				<tr><td><h4>Player 2</h4></td></tr>
			</thead>
			<tbody>
				{table2[0]}
				{table2[1]}
			</tbody>
		</table>
		<div>
			<h4>Value: {state.val}</h4>
		</div>
	</div>);
}

// structure of the app
const App = (state) => {
    return (<div>
    	{header()}
    	{gameSize(state)}
    	{matrixEntry(state)}
    	{solutionSet(state)}
    </div>);
}

// title header
const header = (state) => {
	return (<h1>2D Matrix Game Solver</h1>);
}

// initial state and add the app to the page
let store = createStore(reducer);
ReactDOM.render(App(store.getState()), document.getElementById('app'));

// hook the updates
store.subscribe(() => {
	ReactDOM.render(App(store.getState()), document.getElementById('app'));
});
