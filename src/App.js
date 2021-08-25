import './App.css';
import BulletGraph from './BulletGraph';
import { useState } from 'react';

function App() {
  const [points, setPoints] = useState([
    { name: 'x', x: 5 }
  ]);

  const [ranges, setRanges] = useState(
    {
      type: 'finiteToFinite',
      ranges: [
        { x: 1.0 }, //our start point
        { name: 'Acidic', x: 6.5 },
        { name: 'Neutral', x: 8.5 },
        { name: 'Basic', x: 14.0 }, //14.0 would be end point
      ]
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
      { name: 'basic' }, //(300, infinite] //no x here!!!
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
    ranges: [ //OPTIONAL: you can leave ranges undefined and it will display negative/positive
      { name: 'acidic', x: 100 }, //[0, 100]
      { name: 'neutral', x: 300 }, //(100, 300]
      { name: 'basic'}, //(300, 500] //no x here!!!
    ]
  }

  'percentage': {
    type: 'percentage',
    ranges: [ //OPTIONAL: we can leave labeled ranges as undefined and it will just be 0% to 100%
      {name: 'ok', x: 0.20},
      {name: 'hey', x: 0.50},
      {name: 'no', x: 1} //if using labeled ranges, there at least needs to be one that goes up to 1
    ]
  }

  */

  const randomizePoints = () => {
    let numPoints = Math.floor(Math.random() * 6);
    let points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push({
        name: `bulet point ${i + 1}`,
        x: (Math.random() * 13 + 1),
        unit: 'pH'
      });
    }

    setPoints(points);
  };

  return (
    <div className="App">
      {/* the style on the div is just for a test on screen responsiveness */}
      <div>
        <BulletGraph
          points={points}
          sensorRanges={ranges}
          barWidth={25}
          fixed={1}
        />
      </div>


      <button onClick={randomizePoints}> randomize points</button>
      {points.map(point => <div>{point.name} : {point.x}</div>)}
    </div>
  );
}

export default App;
