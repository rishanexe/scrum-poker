import './App.css';
import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { createClient } from '@supabase/supabase-js'



function App() {

	const [username, setUsername] = useState('');
	const [submit, setSubmit] = useState(0);
	const [point, setPoint] = useState(0);
	const [average, setAverage] = useState(0);

	const supabaseUrl = 'https://ppmzxkhxfxenkdygnibd.supabase.co'
	const supabaseKey = process.env.REACT_APP_SUPABASE_KEY
	const supabase = createClient(supabaseUrl, supabaseKey)

	const handleSubmit = async e => {
		e.preventDefault()
		const formData = new FormData(e.target)
		const formDataObj = Object.fromEntries(formData.entries())
		setUsername(formDataObj['username'])
		const { data, error } = await supabase
				.from('poker')
				.upsert({ name: formDataObj['username'], points: point })
				.select();
		setSubmit(1)
	}

	return (
		<div className="App">
			<header className="App-header">
			{submit===0 ? <>
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
				:<>
					<h1>{username}</h1>
				</>
				}
			</header>
		</div>
	);
}

export default App;
