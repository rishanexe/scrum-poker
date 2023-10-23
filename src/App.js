import './App.css';
import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { createClient } from '@supabase/supabase-js';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';


function App() {

	const supabaseUrl = 'https://ppmzxkhxfxenkdygnibd.supabase.co'
	const supabaseKey = process.env.REACT_APP_SUPABASE_KEY
	const supabase = createClient(supabaseUrl, supabaseKey)

	useEffect(() => {
		const poker = supabase.channel('custom-data-channel')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'poker' },
				(payload) => {
					console.log('Change received!', payload)
					fetchData()
				}
			)
			.subscribe();

		const showPoints = supabase.channel('custom-show-channel')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'show' },
				(payload) => {
					console.log('Change received!', payload)
					fetchShow()
				}
			)
			.subscribe();

		async function fetchShow() {
			let { data: showP, error } = await supabase.from('show').select('show');
			setShow(showP[0]['show']);
		}
		fetchShow();

	}, []);

	const [username, setUsername] = useState('');
	const [submit, setSubmit] = useState(0);
	const [point, setPoint] = useState(0);
	const [average, setAverage] = useState(0);
	const [table, setTable] = useState([]);
	const [show, setShow] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault()
		const formData = new FormData(e.target)
		const formDataObj = Object.fromEntries(formData.entries())
		setUsername(formDataObj['username'])
		const { data, error } = await supabase
			.from('poker')
			.upsert({ name: formDataObj['username'], points: point })
			.select();
		fetchData()
		setSubmit(1)
	}

	async function fetchData() {
		let { data: poker, error } = await supabase.from('poker').select('*')
		setTable(poker);
		calcAvg(poker);
		console.log(table)
	}

	function calcAvg(poker) {
		if (poker.length == 0) {
			setAverage(0)
		}
		else {
			var sum = 0
			poker.forEach((item, index) => {
				sum = sum + parseInt(item['points'])
			})
			const average = Math.round(sum / poker.length);
			setAverage(average);
		}
	}

	const updatePoint = async p => {
		setPoint(p)
		const { data, error } = await supabase
			.from('poker')
			.update({ points: p })
			.eq('name', username)
			.select();
	}

	const updateShow = async e => {
		const { data, error } = await supabase
			.from('show')
			.update({ show: !show })
			.eq('show', show)
			.select();
		setShow(!show)
	}

	const hideShow = async e => {
		const { data, error } = await supabase
			.from('show')
			.update({ show: false })
			.eq('show', true)
			.select();
		setShow(false)
	}

	const clearAll = async e => {
		const { data, error } = await supabase
			.from('poker')
			.update({ points: 0 })
			.neq('points', 0)
			.select();
		setPoint(0);
		hideShow();
	}


	return (
		<div className="App">
			<header className="App-header">
				{submit === 0 ? <>
					<h1>Scrum Poker</h1>
					<br />
					<Form onSubmit={handleSubmit}>
						<Form.Label>Enter Name</Form.Label>
						<Form.Control
							name="username"
							type="text"
							placeholder="John"
						/>
						<Button type="submit">Enter</Button>
					</Form>
				</>
					: <>
						<h1>{username}</h1>
						<br />
						<ButtonToolbar aria-label="Toolbar with button groups">
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(1)} variant={point == 1 ? "primary" : "light"}>1</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(2)} variant={point == 2 ? "primary" : "light"}>2</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(3)} variant={point == 3 ? "primary" : "light"}>3</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(4)} variant={point == 4 ? "primary" : "light"}>4</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(5)} variant={point == 5 ? "primary" : "light"}>5</Button>
							</ButtonGroup>
						</ButtonToolbar>
						<br />
						<Button onClick={() => clearAll()} variant='danger'>Clear All</Button>
						<br />
						<Table striped bordered hover variant="dark">
							<thead>
								<tr>
									<th>Name</th>
									<th>Points  <Button onClick={() => updateShow()}>{show == true ? "Hide" : "Show"}</Button></th>
								</tr>
							</thead>
							{table.map((item) => {
								return (
									<tbody>
										<tr>
											<td>{item['name']}</td>
											<td>
												{show == true ? <> {item['points'] == 0 ? '' : item['points']}</> : "Hidden"} {''}
												{item['points'] != 0 ?
													<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
														<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
													</svg>
													: ''
												}
											</td>
										</tr>
									</tbody>
								)
							})}
						</Table>
						{console.log(table)}
						<br />
						<h3>Average: {show == true ? average : 'Hidden'}</h3>
					</>
				}
			</header>
		</div>
	);
}

export default App;
