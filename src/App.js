import './App.css';
import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';

// Firebase imports
import { initializeApp } from "firebase/app";
import {
	getFirestore,
	doc,
	getDoc,
	setDoc,
	collection,
	getDocs,
	updateDoc,
	query,
	onSnapshot
} from "firebase/firestore";


function App() {

	const firebaseConfig = {
		apiKey: process.env.REACT_APP_FIREBASE_KEY,
		authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
		storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.REACT_APP_FIREBASE_MSG_SEND_ID,
		appId: process.env.REACT_APP_FIREBASE_APP_ID,
		measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
		databaseURL: process.env.REACT_APP_FIREBASE_DB_URL
	};

	const app = initializeApp(firebaseConfig);
	const db = getFirestore(app);

	useEffect(() => {

		async function fetchSprint(docName) {
			const docSnap = await getDoc(doc(db, "sprint_mapping", docName));
			setSprint(docSnap.data()['sprint']);
		}
		const windowUrl = window.location.search;
		const params = new URLSearchParams(windowUrl);
		if (params.get('s') !== null) {
			setCode(params.get('s'));
			fetchSprint(params.get('s'))
			setUrl('https://agilemate.onrender.com/?s=' + params.get('s'));
		}

		// Realtime listerner for show table
		const showQuery = query(collection(db, "show"));
		const unsubscribeShow = onSnapshot(showQuery, (querySnapshot) => {
			fetchShow()
		});

		async function fetchShow() {
			// let { data: showP, error } = await supabase.from('show').select('show');
			const querySnapshot = await getDocs(collection(db, "show"));
			querySnapshot.forEach((doc) => {
				setShow(doc.data()['show']);
			});
		}
		fetchShow();

	}, []);

	const [username, setUsername] = useState('');
	const [sprint, setSprint] = useState('initial_sprint');
	const [url, setUrl] = useState('https://agilemate.onrender.com/');
	const [code, setCode] = useState('');
	const [submit, setSubmit] = useState(0);
	const [point, setPoint] = useState(0);
	const [average, setAverage] = useState(0);
	const [table, setTable] = useState([]);
	const [show, setShow] = useState(false);
	const [fsId, setFsid] = useState([]);
	const [admin, setAdmin] = useState(0);

	const handleSubmit = async e => {
		e.preventDefault()
		const formData = new FormData(e.target)
		const formDataObj = Object.fromEntries(formData.entries())
		setUsername(formDataObj['username'])
		setSprint(formDataObj['sprint'])

		var t_admin = 0;
		const querySnapshot = await getDocs(collection(db, formDataObj['sprint']));
		if (querySnapshot.size === 0) {
			t_admin = 1;
			var lobbyId = Math.random().toString(36).substring(2, 10);
			setCode(lobbyId);
			setUrl('https://agilemate.onrender.com/?s=' + lobbyId);
			await setDoc(doc(db, 'sprint_mapping', lobbyId), { sprint: formDataObj['sprint'] });
		}
		else {
			querySnapshot.forEach((doc) => {
				if (doc.data()['name'] === formDataObj['username']) {
					t_admin = doc.data()['admin'];
				}
			});
		}

		setAdmin(t_admin);

		const data = {
			name: formDataObj['username'],
			points: point,
			admin: t_admin
		}
		await setDoc(doc(db, formDataObj['sprint'], formDataObj['username']), data);
		setSubmit(1)

		// Realtime listerner for poker table
		const pokerQuery = query(collection(db, formDataObj['sprint']));
		const unsubscribePoker = onSnapshot(pokerQuery, (querySnapshot) => {
			fetchData(formDataObj['sprint'])
		});
	}

	const handleLobbySubmit = async e => {
		e.preventDefault()
		const formData = new FormData(e.target)
		const formDataObj = Object.fromEntries(formData.entries())
		setUsername(formDataObj['username'])

		var t_admin = 0;
		const querySnapshot = await getDocs(collection(db, sprint));
		if (querySnapshot.size === 0) {
			t_admin = 1
		}
		else {
			querySnapshot.forEach((doc) => {
				if (doc.data()['name'] === formDataObj['username']) {
					t_admin = doc.data()['admin'];
				}
			});
		}

		setAdmin(t_admin);

		const data = {
			name: formDataObj['username'],
			points: point,
			admin: t_admin
		}
		await setDoc(doc(db, sprint, formDataObj['username']), data);
		setSubmit(1)

		// Realtime listerner for poker table
		const pokerQuery = query(collection(db, sprint));
		const unsubscribePoker = onSnapshot(pokerQuery, (querySnapshot) => {
			fetchData(sprint)
		});
	}

	async function fetchData(sprint_name) {
		const dataArr = []
		const fid = []
		const querySnapshot = await getDocs(collection(db, sprint_name));
		querySnapshot.forEach((doc) => {
			dataArr.push(doc.data());
			fid.push(doc.id);
		});
		setTable(dataArr)
		setFsid(fid)
		calcAvg(dataArr)
	}

	function calcAvg(poker) {
		if (poker.length === 0) {
			setAverage(0)
		}
		else {
			var sum = 0
			var zeroCount = 0
			poker.forEach((item, index) => {
				if (item['points'] === 0) {
					zeroCount = zeroCount + 1;
				} else {
					sum = sum + parseInt(item['points'])
				}
			})
			const average = Math.round(sum / (poker.length - zeroCount));
			setAverage(average);
		}
	}

	const updatePoint = async p => {
		const userDocRef = doc(db, sprint, username);
		await updateDoc(userDocRef, {
			points: p
		});
		setPoint(p)
	}

	const updateShow = async e => {
		const showDocRef = doc(db, "show", "show");
		await updateDoc(showDocRef, {
			show: !show
		});
		setShow(!show)
	}

	const hideShow = async e => {
		const showDocRef = doc(db, "show", "show");
		await updateDoc(showDocRef, {
			show: false
		});
		setShow(false)
	}

	const clearAll = async e => {
		fsId.forEach(async (id) => {
			const userDocRef = doc(db, sprint, id);
			await updateDoc(userDocRef, {
				points: 0
			});
		})
		setPoint(0);
		hideShow();
	}

	const exit = async e => {
		setSubmit(0);
	}


	return (
		<div className="App">
			<header className="App-header">
				{submit === 0 ?
					code.match(/^[0-9a-z]+$/) ?
						<>
							<h1>Agilemate</h1>
							<p>Scrum Poker</p>
							<br />
							<Form onSubmit={handleLobbySubmit}>
								<h3>Lobby: {sprint}</h3>
								<br />
								<Form.Control
									name="username"
									type="text"
									placeholder="Your name (Ex. John)"
								/>
								<br />
								<Button type="submit">Enter</Button>
							</Form>
						</>
						: <>
							<h1 className="text-info">Agilemate</h1>
							<p>Scrum Poker</p>
							<br />
							<Form onSubmit={handleSubmit}>
								<Form.Label>Enter Lobby</Form.Label>
								<Form.Control
									name="sprint"
									type="text"
									placeholder="Lobby name (Sprint 61)"
								/>
								<br />
								<Form.Control
									name="username"
									type="text"
									placeholder="Your name (John)"
								/>
								<br />
								<Button type="submit">Enter</Button>
							</Form>
						</>
					: <>
						<p style={{ fontSize: "20px" }}>Invite: <a href={url} target="_blank">{url}</a></p>
						<h1>{sprint} <Button onClick={() => exit()} variant='danger'>Exit</Button></h1>
						<br />
						<p>Hello {username}</p>
						<ButtonToolbar aria-label="Toolbar with button groups">
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(0)} variant={point === 0 ? "primary" : "light"}>Clear</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(1)} variant={point === 1 ? "primary" : "light"}>1</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(2)} variant={point === 2 ? "primary" : "light"}>2</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(3)} variant={point === 3 ? "primary" : "light"}>3</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(4)} variant={point === 4 ? "primary" : "light"}>4</Button>
							</ButtonGroup>
							<ButtonGroup className="me-2" aria-label="First group">
								<Button onClick={() => updatePoint(5)} variant={point === 5 ? "primary" : "light"}>5</Button>
							</ButtonGroup>
						</ButtonToolbar>
						<br />
						{admin === 1 ? <Button onClick={() => clearAll()} variant='warning'>Clear All</Button> : ''}
						<br />
						<Table striped bordered hover variant="dark">
							<thead>
								<tr>
									<th>Name</th>
									<th>Points  {admin === 1 ? <Button onClick={() => updateShow()}>{show === true ? "Hide" : "Show"}</Button> : ''}</th>
								</tr>
							</thead>
							{table.map((item) => {
								return (
									<tbody>
										<tr>
											<td>
												{item['admin'] === 1 ?
													<span style={{ paddingRight: '10px' }}>
														<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
															<path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
															<path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
														</svg>
													</span>
													: ''}
												{item['name']}
												{item['name'] === username ? ' (You)' : ''}
											</td>
											<td>
												{show === true ? <> {item['points'] === 0 ? '' : item['points']}</> : "Hidden"} {''}
												{item['points'] !== 0 ?
													<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="green" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
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
						<br />
						<h3>Average: {show === true ? average : 'Hidden'}</h3>
					</>
				}
				<p style={{ fontSize: "15px", marginTop: "10%" }}>Developed by <span className="text-info"><b>Rishan</b></span></p>
			</header>
		</div>
	);
}

export default App;
