import React from "react";

import Highcharts from 'highcharts';
import HighchartsAccessibility from 'highcharts/modules/accessibility';
import HighchartsReact from 'highcharts-react-official';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsParallelCoordinates from 'highcharts/modules/parallel-coordinates';
HighchartsExporting(Highcharts);
HighchartsAccessibility(Highcharts);
HighchartsParallelCoordinates(Highcharts);






interface ParallelCoordinatesProps {
  data_orig: string;
  limits: any;
  custom: any;
  scrolling: boolean;
}

const arePropsEqual = (prevProps: ParallelCoordinatesProps, nextProps: ParallelCoordinatesProps) => {
  if (nextProps.scrolling) return true;
  return (
    prevProps.data_orig === nextProps.data_orig &&
    prevProps.limits === nextProps.limits &&
    prevProps.custom === nextProps.custom
  );
};


const ParallelCoordinates: React.FC<ParallelCoordinatesProps> = React.memo(({ data_orig, limits, custom, scrolling }) => {
  console.log("ParallelCoordinates update " + scrolling);
  if(data_orig === "") return (<div></div>);

  var columns: Array<string>;
  var data: Array<Array<number>>;
  //the data is a csv string. the first row is the column names. the rest needs to be converted to a 2d array
  var lines = data_orig.split("\n");
  columns = lines[0].split(",");
  data = [];
  for (var i = 1; i < lines.length; i++) {
    var currentline = lines[i].split(",");
    var row = [];
    for (var j = 0; j < currentline.length; j++) {
      row.push(parseFloat(currentline[j]));
    }
    data.push(row);
  }

  //add custom to data
  row = [];
  var keys = Object.keys(custom);
  for (i = 0; i < keys.length; i++) {
    var key = keys[i];
    row.push(custom[key]);
  }
  data.push(row);


  var limits2:any = [];
  for (i = 0; i < columns.length; i++) {
    var name:string = columns[i].trim();
    limits2.push({
      type: 'linear',
      min: Math.floor(limits[name][0]),
      max: Math.ceil(limits[name][1]),
      startOnTick: false,
      reversed: false,
      tickInterval: 1,
    });
  }


  // to make the visualization easier to see, we only show the 5 rows that are closest to the custom row (square of the distance is used as a metric)
  var customrow = data[data.length - 1];
  var distances:Array<number> = [];
  for (i = 0; i < data.length - 1; i++) {
    var currentrow = data[i];
    var distance = 0;
    for (j = 0; j < currentrow.length; j++) {
      distance += (currentrow[j] - customrow[j]) * (currentrow[j] - customrow[j]);
    }
    distances.push(distance);
  }
  var indices = distances.map((x, i) => i).sort((a, b) => distances[a] - distances[b]);
  var newdata = [];
  for (i = 0; i < 5; i++) {
    newdata.push(data[indices[i]]);
  }
  newdata.push(customrow);
  data = newdata;
  
  
  const getOptions = () => ({
    chart: {
      type: 'line',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      width: 450,
      height: 250,
      parallelCoordinates: true,
      parallelAxes: {
        lineWidth: 2,
      },
    },
    title: {
      text: '',
    },
    xAxis: {
      categories: columns,
      offset: 10,
      labels: {
        useHTML: true,
      },
    },
    yAxis: limits2,
    series: data.map((set, i) => ({
      name: `Line ${i}`,
      data: set,
      color: (i == (data.length - 1) ? '#3f51b5' : 'rgba(0, 0, 0, 0.4)'),
      lineWidth: (i == (data.length - 1) ? 4 : 1),
    })),
    credits: {
      enabled: false,
    },
    tooltip: {
      enabled: false,
    },
  });


  return <HighchartsReact highcharts={Highcharts} options={getOptions()} />;
},arePropsEqual);


export default ParallelCoordinates;
