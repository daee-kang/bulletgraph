import logo from './logo.svg';
import './App.css';
import BulletGraph from './BulletGraph';
import { useState } from 'react';

function App() {
  const [points, setPoints] = useState([
    { name: 'bullet point 1', x: 5, unit: 'pH' },
    { name: 'bullet point 2', x: 1, unit: 'pH' },
    { name: 'bullet point 3', x: 10.5, unit: 'pH' }
  ]);

  const [ranges, setRanges] = useState([
    { name: 'acidic', x: 6.5 },
    { name: 'neutral', x: 8.5 },
    { name: 'basic', x: 14.0 },
  ]);

  const randomizePoints = () => {
    let numPoints = Math.floor(Math.random() * 6);
    let points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push({
        name: `bulet point ${i + 1}`,
        x: (Math.random() * 14.0).toPrecision(2),
        unit: 'pH'
      });
    }

    setPoints(points);
  };

  return (
    <div className="App">
      <div style={{ width: '80%', backgroundColor: 'gray' }}>
        <BulletGraph points={points} sensorRanges={ranges} />
      </div>

      <button onClick={randomizePoints}> randomize points</button>
      {points.map(point => <div>{point.name} : {point.x}</div>)}
    </div>
  );
}

export default App;
