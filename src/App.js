import logo from './logo.svg';
import './App.css';
import BulletGraph from './BulletGraph';
import { useState } from 'react';

function App() {
  const [points, setPoints] = useState([
    { name: 'bullet point 1', x: -500, unit: 'pH' },
    { name: 'bullet point 2', x: 100, unit: 'pH' },
    { name: 'bullet point 3', x: 3000, unit: 'pH' }
  ]);

  const [ranges, setRanges] = useState(
    {
      type: 'infiniteToInfinite'
    }
  );

  /* 
  'finiteToFinite': {
    type: 'finiteToFinite',
    ranges: [
      { x: 1.0 }, //our start point
      { name: 'acidic', x: 6.5 },
      { name: 'neutral', x: 8.5 },
      { name: 'basic', x: 14.0 }, //14.0 would be end point
    ]
  }

  'zeroToInfinite': {
    type: 'zeroToInfinite',
    ranges: [
      { name: 'acidic', x: 100 }, //[0, 100]
      { name: 'neutral', x: 300 }, //(100, 300]
      { name: 'basic' }, //(300, infinite]
    ]
  }

  'zeroToFinite': {
    type: 'zeroToFinite',
    ranges: [
      { name: 'acidic', x: 100 }, //[0, 100]
      { name: 'neutral', x: 300 }, //(100, 300]
      { name: 'basic', x: 500 }, //(300, 500]
    ]
  }

  'infiniteToInfinite': {
    type: 'infiniteToInfinite',
    ranges: [ //you can leave ranges undefined and it will display negative/positive
      { name: 'acidic', x: 100 }, //[0, 100]
      { name: 'neutral', x: 300 }, //(100, 300]
      { name: 'basic'}, //(300, 500]
    ]
  }

  */

  const randomizePoints = () => {
    let numPoints = Math.floor(Math.random() * 6);
    let points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push({
        name: `bulet point ${i + 1}`,
        x: (Math.random() * 500 - 250),
        unit: 'pH'
      });
    }

    setPoints(points);
  };

  return (
    <div className="App">
      {/* the style on the div is just for a test on screen responsiveness */}
      <div>
        <BulletGraph points={points} sensorRanges={ranges} />
      </div>

      <button onClick={randomizePoints}> randomize points</button>
      {points.map(point => <div>{point.name} : {point.x}</div>)}
    </div>
  );
}

export default App;
