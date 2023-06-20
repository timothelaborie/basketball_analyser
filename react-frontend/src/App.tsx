import Slider from "@material-ui/core/Slider";
import { styled } from "@material-ui/core/styles";
import * as d3 from "d3";
import { Steps } from "intro.js-react";
import "intro.js/introjs.css";
import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import ParallelCoordinates from './components/ParallelCoordinates';
import Popup from './components/Popup';
import axiosClient from './router/apiClient';
//@ts-ignore
import ColorThief from 'colorthief';
//@ts-ignore
import chroma from 'chroma-js';

// let DISABLE_TUTORIAL = true;
// let DISABLE_TUTORIAL = false;

let DISABLE_TUTORIAL = localStorage.getItem("DISABLE_TUTORIAL") === "true";
console.log("DISABLE_TUTORIAL: " + DISABLE_TUTORIAL);


// Maps team ids to the team name
const teamid2name = new Map([
  [0, 'Custom Home Team'],
  [1, 'Custom Away Team'],
  [1610612737, 'Atlanta Hawks'],
  [1610612738, 'Boston Celtics'],
  [1610612740, 'New Orleans Pelicans'],
  [1610612741, 'Chicago Bulls'],
  [1610612742, 'Dallas Mavericks'],
  [1610612743, 'Denver Nuggets'],
  [1610612745, 'Houston Rockets'],
  [1610612746, 'Los Angeles Clippers'],
  [1610612747, 'Los Angeles Lakers'],
  [1610612748, 'Miami Heat'],
  [1610612749, 'Milwaukee Bucks'],
  [1610612750, 'Minnesota Timberwolves'],
  [1610612751, 'Brooklyn Nets'],
  [1610612752, 'New York Knicks'],
  [1610612753, 'Orlando Magic'],
  [1610612754, 'Indiana Pacers'],
  [1610612755, 'Philadelphia 76ers'],
  [1610612756, 'Phoenix Suns'],
  [1610612757, 'Portland Trail Blazers'],
  [1610612758, 'Sacramento Kings'],
  [1610612759, 'San Antonio Spurs'],
  [1610612760, 'Oklahoma City Thunder'],
  [1610612761, 'Toronto Raptors'],
  [1610612762, 'Utah Jazz'],
  [1610612763, 'Memphis Grizzlies'],
  [1610612764, 'Washington Wizards'],
  [1610612765, 'Detroit Pistons'],
  [1610612766, 'Charlotte Hornets'],
  [1610612739, 'Cleveland Cavaliers'],
  [1610612744, 'Golden State Warriors']
]);

// Maps boxscore abreviations to their full name
const abbreviation2boxscore = new Map([
  ['AST', 'Assists'],
  ['BLK', 'Blocks'],
  ['DREB', 'Defensive Rebounds'],
  ['FG3A', '3 Point Field Goal Attempts'],
  ['FGA', 'Field Goal Attempts'],
  ['FTA', 'Free Throw Attempts'],
  ['OREB', 'Offensive Rebounds'],
  ['STL', 'Steals'],
  ['TO', 'Turnovers']
]);




const VerticalSlider = styled(Slider)({
  height: "182px !important",
  margin: "auto 0 !important",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
});

//for some reason defining this doesn't do anything
interface BoxScores {
  AST: number;
}

interface PlayerStatsSliderProps {
  boxScores: BoxScores;
  onSliderChange: (key: keyof BoxScores, value: number) => void;
  onMouseUp: any;
  boxScoreBoundaries: any;
}

const BoxScoreSlider: React.FC<PlayerStatsSliderProps> = ({
  boxScores,
  onSliderChange,
  onMouseUp,
  boxScoreBoundaries,
}) => {

  const handleSliderChange = (
    key: keyof BoxScores,
    event: any,
    value: number | number[]
  ) => {
    onSliderChange(key, value as number);
  };

  return (
    <>
      <div className='allSliders'>
        {Object.entries(boxScores).map(([key, value]) => (
          <div key={key} className='slidercontainer'>
            {/* <p>{key}</p> */}
            <VerticalSlider
              orientation="vertical"
              value={value}
              onChange={(event, value) =>
                handleSliderChange(key as keyof BoxScores, event, value)
              }
              aria-labelledby="continuous-slider"
              min={Math.floor(boxScoreBoundaries[key][0])}
              max={Math.ceil(boxScoreBoundaries[key][1])}
              step={(boxScoreBoundaries[key][1] - boxScoreBoundaries[key][0]) / 100}
              draggable 
              onChangeCommitted ={() => {onMouseUp()}}
            />
          </div>
        ))}
      </div>
    </>
  );
};








interface Team {
  TEAM_ID: number;
  name: string;
}

interface Props {
  ids: Team[];
  onSelection: (selectedId: Team) => void;
  selectedTeam: Team | undefined;
  title: string;
}

const DropdownMenu: React.FC<Props> = ({ ids, onSelection, selectedTeam, title }) => {
  // console.log("DropdownMenu");
  // console.log(selectedTeam);
  const handleSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // console.log("handleSelection");
    let teams:Team[] = ids;
    let target: string = event.target.value;
    let team:Team = ids[0];
    // find the team with the matching id
    for (let i = 0; i < teams.length; i++) {
      if (teams[i].name == target) {
        team = teams[i];
      }
    }
    onSelection(team);
  };

  let selectedValue = selectedTeam?.name ?? '';
  // console.log(selectedValue);
  let ids2 = ids.slice();
  ids2.push({TEAM_ID: ids[0].TEAM_ID, name: "Custom Team"});

  return (
    <select value={selectedValue} onChange={handleSelection} className={"select_" + title}>
      {ids2.map((team) => (
        <option key={team.TEAM_ID + "_" + team.name + "_" + title} value={team.name}>
          {team.name} 
          
        </option>
      ))}
    </select>
  );
};




interface TeamSelectorProps {
  title: string;
  availableTeams: Team[];
  selectedTeam: Team;
  setSelectedTeam: (selectedId: Team) => void;
  setBgColor: (color: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ title, availableTeams, selectedTeam, setSelectedTeam, setBgColor }) => {
  const BASE_URL = process.env.NODE_ENV==="production"? `http://be.${window.location.hostname}/api/v1`:"http://localhost:8000/"
  const colorThief = new ColorThief();

  useEffect(() => {
    const imgPath = BASE_URL + "api/logo/" + selectedTeam.TEAM_ID;

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try{
        let color = colorThief.getColor(img);

        // Convert the color to chroma color format
        const chromaColor = chroma.rgb(color[0], color[1], color[2]);

        // Desaturate the color by 50%
        const desaturatedColor = chromaColor.desaturate(1);

        let min_allowed = 150;
        let colormin = Math.min(color[0], color[1], color[2]);

        let fix_color = (c:number) => {
          // c+=brightness_boost;
          if (colormin < min_allowed) {
            //increase all 3 values so that the darkest value is min_allowed
            c += min_allowed - colormin;
            if(c>255) c=255;
          }
          return c;
        }

      const mutedRGB = desaturatedColor.rgb();

      let rgb = `rgb(${fix_color(mutedRGB[0])}, ${fix_color(
        mutedRGB[1]
      )}, ${fix_color(mutedRGB[2])})`;
        setBgColor(rgb);
      } catch (e) {
        console.log(e);
      }
    };

    img.src = imgPath;

  }, [selectedTeam]);

  return (
    <>
      <div className="box teamselector">
        <img className="team_logo" src={BASE_URL + "api/logo/" + selectedTeam.TEAM_ID} alt="team logo" />
        <DropdownMenu ids={availableTeams} onSelection={setSelectedTeam} selectedTeam={selectedTeam} title={title} />
      </div>
    </>
  );
};











interface ShapDisplayProps {
  param: string;
}

const ShapDisplay: React.FC<ShapDisplayProps> = ({ param }) => {

  return (
    <>
      <div className="box shap" id="shapbox">
        <h2>Feature Importance</h2>
        <iframe id="shapframe" srcDoc={param}></iframe>
      </div>
    </>
  );
};







interface WinChanceDisplayProps {
  probability: number;
}

const WinChanceDisplay: React.FC<WinChanceDisplayProps> = ({ probability }) => {

  return (
    <>
      <div className="box winprob">
        <h2>Winning Probability</h2>
        <p>{Math.round(probability*100)}%</p>
      </div>
    </>
  );
};






interface Point {
  OR: number;
  DR: number;
  TEAM_ID: number;
}

interface ScatterplotProps {
  points: Point[];
}

let addedPoints: boolean = false;
const Scatterplot: React.FC<ScatterplotProps> = ({ points }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (points.length === 0) {
      return;
    }
    const svg = d3.select(svgRef.current);

    // const xScale = d3.scaleLinear().domain([100, 120]).range([10, 90]);
    // const yScale = d3.scaleLinear().domain([50, 40]).range([10, 90]);
    let min_x = 1000;
    let max_x = -1000;
    let min_y = 1000;
    let max_y = -1000;
    for (let i = 0; i < points.length; i++) {
      if (points[i].OR < min_x) {
        min_x = points[i].OR;
      }
      if (points[i].OR > max_x) {
        max_x = points[i].OR;
      }
      if (points[i].DR < min_y) {
        min_y = points[i].DR;
      }
      if (points[i].DR > max_y) {
        max_y = points[i].DR;
      }
    }
    const xScale = d3.scaleLinear().domain([min_x, max_x]).range([5, 80]);
    const yScale = d3.scaleLinear().domain([max_y, min_y]).range([5, 80]);


    if (!addedPoints) {
      addedPoints = true;

      // function that takes a team object and processes it into a formatted tooltip
      const process_tooltip = (d: any) => {
        
        // boxscore stats to include in tooltip
        const propertiesInlcuded = ['AST', 'BLK', 'DREB', 'FG3A', 'FGA', 'FTA', 'OREB', 'STL', 'TO'];

        // Create an array to store the tooltip content
        const tooltipContent = [];

        // Use name of team as title of tooltip
        tooltipContent.push(`<span class="tooltip-title">${teamid2name.get(d.TEAM_ID)}</span>`);

        // Iterate over the object properties (excluding the title)
        for (const key of propertiesInlcuded) {
          if (Object.hasOwnProperty.call(d, key) && key) {
            const property = key;
            let value = d[key];

            // Round numbers
            if (typeof value === 'number') {
              value = Math.round(value * 100) / 100;
            }
            
            // Add the formatted property-value pair to the tooltip content array
            tooltipContent.push(`${abbreviation2boxscore.get(property)}: ${value}`);
          }
        }

        // Join the tooltip content array elements with line breaks
        const formattedTooltip = tooltipContent.join('<br>');

        return formattedTooltip
      };


      // Add points to the scatterplot
      svg
        .selectAll('image')
        //@ts-ignore
        .data(points, (d) => d.TEAM_ID)
        .enter()
        .append('image')
        .attr('x', (d) => xScale(d.OR))
        .attr('y', (d) => yScale(d.DR))
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', (d) => `http://localhost:8000/api/logo/${d.TEAM_ID == 0 ? 5 : (d.TEAM_ID == 1 ? 4 : d.TEAM_ID)}`)
        .on('mouseover', function (event, d) {
          // Show hover details on mouseover and bring logo to front
          d3.select('#tooltip')
            .style('opacity', 1)
            .html(`${process_tooltip(d)}`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`)
            .raise();

          // Bring hovered logo to front
          d3.select(this).raise();

          
        })
        .on('mousemove', function (event) {
          // Move hover details on mousemove
          d3.select('#tooltip')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);
        })
        .on('mouseout', function (event, d) {
          // Hide hover details on mouseout
          d3.select('#tooltip').style('opacity', 0).html('');
        });



      } else {
      // Update point locations
      svg
        .selectAll('image')
        //@ts-ignore
        .data(points, (d) => d.TEAM_ID) // give each point a unique ID based on TEAM_ID
        .order() // sort the SVG elements based on their ID
        .transition()
        .duration(1000)
        .attr('x', (d) => xScale(d.OR))
        .attr('y', (d) => yScale(d.DR));
    }
  }, [points]);

  return (
    <>
      <div className='box' id="tacticalClustering">
        <h2>League Overview</h2>
        <svg ref={svgRef} viewBox='0 0 100 100' id='clustering'></svg>
        <div className="yaxis">Defensive Performance</div>
        <div className="xaxis">Offensive Performance</div>
      </div>
    </>
  );
};









// args are an array of these objects:
// AST_away : 24 AST_home : 28 Away Team : "Boston Celtics" FG3_PCT_away : 0.268 FG3_PCT_home : 0.351 FG_PCT_away : 0.44 FG_PCT_home : 0.506 FT_PCT_away : 0.824 FT_PCT_home : 0.833 GAME_DATE_EST : "2021-11-17" GAME_ID : 22100215 GAME_STATUS_TEXT : "Final" Game Date : "17. November 2021" HOME_TEAM_ID : 1610612737 HOME_TEAM_WINS : 1 Home Team : "Atlanta Hawks" PTS_away : 99 PTS_home : 110 REB_away : 42 REB_home : 40 SEASON : 2021 Score : "110-99" TEAM_ID_away : 1610612738 TEAM_ID_home : 1610612737 VISITOR_TEAM_ID : 1610612738 Winning Team : "Home (Atlanta Hawks)" date : "Wed, 17 Nov 2021 00:00:00 GMT"

interface SimilarMatchupsDisplayProps {
  matchups: any[];
}

const SimilarMatchupsDisplay: React.FC<SimilarMatchupsDisplayProps> = ({ matchups }) => {
  const BASE_URL = process.env.NODE_ENV==="production"? `http://be.${window.location.hostname}/api/v1`:"http://localhost:8000/"
  // console.log(matchups)
  

  const getTooltip = (matchup: any, home: boolean) => {
    let tooltip = "";
    let to_match = home ? "home" : "away";
    for (let key in matchup) {
      if (key.includes(to_match) && !key.includes("TEAM") && !key.includes("PTS")) {
        let key2 = key.split("_")[0];
        if (key2 === "AST") key2 = "Assists";
        if (key2 === "FG3") key2 = "3 Point Field Goal Percentage";
        if (key2 === "FG") key2 = "Field Goal Percentage";
        if (key2 === "FT") key2 = "Free Throw Percentage";
        if (key2 === "REB") key2 = "Rebounds";
        tooltip += `${key2}: ${matchup[key]}\n`;
      }
    }

    return tooltip;
  };

  return (
    <>
      <div className="box" id="similarMatchups">
        <h2>Similar Matchups</h2>
        {/* For each matchup, display the date, the score and the 2 team logos on each side of the score  */}
        <table>
          <tbody>
            {matchups.map((matchup) => (
              <tr className="matchup" key={matchup["Game Date"] + " " + matchup["Score"]}>
                <td className='date_td'>{matchup["Game Date"]}</td>
                <td className='home_td' title={getTooltip(matchup,true)}><div className="td_text_container"><div className="td_text">{matchup["Home Team"]}</div></div><img className="small_team_logo" src={BASE_URL + "api/logo/" + matchup["TEAM_ID_home"]} alt="team logo"/></td>
                <td className='matchup_td'>{matchup["Score"]}</td>
                <td className='away_td' title={getTooltip(matchup,false)}><img className="small_team_logo" src={BASE_URL + "api/logo/" + matchup["TEAM_ID_away"]} alt="team logo" /><div className="td_text_container"><div className="td_text_right">{matchup["Away Team"]}</div></div></td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </>
  );
};












let scrolling = false;
function App() {

  function loadData(url: string): Promise<any | undefined> {
    console.log(url)
    const promise = axiosClient.get<any>(url)
    return promise
      .then((res) => {
        if (res.status !== 204) {
          return res.data;
        }
        return undefined;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }



  const [availableTeams, setAvailableTeams] = useState<any>([{TEAM_ID: 0, name: "Unknown Team"}]);
  const [selectedTeamLeft, setSelectedTeamLeft] = useState<Team>({TEAM_ID: 0, name: "Unknown Team"});
  const [selectedTeamRight, setSelectedTeamRight] = useState<Team>({TEAM_ID: 0, name: "Unknown Team"});

  const [boxScoresLeft, setBoxScoresLeft] = useState<any>({});
  const [boxScoresRight, setBoxScoresRight] = useState<any>({});
  const [boxScoreBoundaries, setBoxScoreBoundaries] = useState<any>({});

  const [shap, setShap] = useState<string>("");
  const [probabilityLeft, setProbabilityLeft] = useState<number>(0.5);
  const [points, setPoints] = useState<any>([]);

  const [parallelCoordinatesDataHome, setParallelCoordinatesDataHome] = useState<string>("");
  const [parallelCoordinatesDataAway, setParallelCoordinatesDataAway] = useState<string>("");
  const [SimilarMatchups, setSimilarMatchups] = useState<any>([]);
  const [possessions, setPossessions] = useState<any>([]);

  const [DisplayRestOfApp, setDisplayRestOfApp] = useState<boolean>(false);

  const [bgColorLeft, setBgColorLeft] = useState<string>("");
  const [bgColorRight, setBgColorRight] = useState<string>("");

  //User tutorial stuff
  const [ShowTeamSelectorPopup, setShowTeamSelectorPopup] = useState<boolean>(false);
  const [ShowRestOfAppPopup, setShowRestOfAppPopup] = useState<boolean>(false);
  

  


  // load list of teams when page is loaded
  useEffect(() => {
    loadData(`api/boxscore/bounds`).then(data => {
      // console.log(data);
      setBoxScoreBoundaries(data)
      loadData(`api/boxscores/home`).then(data => {
        // console.log(data);
        setParallelCoordinatesDataHome(data);
      });
      loadData(`api/boxscores/away`).then(data => {
        // console.log(data);
        setParallelCoordinatesDataAway(data);
      });
      loadData(`api/teams`).then(data => {
        // console.log(data);
        // data = data.concat({TEAM_ID: 0, name: "Unknown Team"})
        setAvailableTeams(data);
        setShowTeamSelectorPopup(true);
        if(DISABLE_TUTORIAL){
          handleSelectionLeft({TEAM_ID: 1610612737, name: "Atlanta Hawks"})
          handleSelectionRight({TEAM_ID: 1610612738, name: 'Boston Celtics'});
          setDisplayRestOfApp(true);
        }


      });
    });
  }, []);



  const handleSelectionLeft = (selectedTeam: Team) => {
    setSelectedTeamLeft(selectedTeam);
    loadData(`api/boxscore/${selectedTeam.TEAM_ID}/1`).then(data => {
      // console.log(data[0]);
      setBoxScoresLeft(data[0]);
    });
    if(selectedTeamRight.TEAM_ID !== 0 && selectedTeam.TEAM_ID !== 0){
      console.log("displaying rest of app");
      if(DisplayRestOfApp === false){
        setShowRestOfAppPopup(true);
      }
      setDisplayRestOfApp(true);
    }
  };

  const handleSelectionRight = (selectedTeam: Team) => {
    setSelectedTeamRight(selectedTeam);
    loadData(`api/boxscore/${selectedTeam.TEAM_ID}/0`).then(data => {
      // console.log(data[0]);
      setBoxScoresRight(data[0]);
    });
    if(selectedTeamLeft.TEAM_ID !== 0 && selectedTeam.TEAM_ID !== 0){
      console.log("displaying rest of app");
      if(DisplayRestOfApp === false){
        setShowRestOfAppPopup(true);
      }
      setDisplayRestOfApp(true);
    }
  };

  const handleSliderChangeLeft = (key: keyof BoxScores, value: number) => {
    var copy = {...boxScoresLeft};
    copy[key] = value;
    setBoxScoresLeft(copy);
    scrolling = true;
    setSelectedTeamLeft({TEAM_ID: 4, name: "Custom Team"});
  };

  const handleSliderChangeRight = (key: keyof BoxScores, value: number) => {
    // console.log(key, value,"right");
    var copy = {...boxScoresRight};
    copy[key] = value;
    setBoxScoresRight(copy);
    // console.log(copy);
    scrolling = true;
    setSelectedTeamRight({TEAM_ID: 5, name: "Custom Team"});
  };

  const onSliderMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    console.log("mouse up");
    scrolling = false;
    updateEverything();
  };

  useEffect(() => {
    if(boxScoresLeft["AST"] && boxScoresRight["AST"]){
      updateEverything();
      setTimeout(() => {
        //add tooltips
        const labels = document.querySelectorAll('.highcharts-xaxis-labels span');
        labels.forEach((label, i) => {
          // console.log(label);
          let orig_text = label.innerHTML;
          let tooltip = "";
          if(orig_text == "AST") tooltip = "Assists";
          if(orig_text == "BLK") tooltip = "Blocks";
          if(orig_text == "DREB") tooltip = "Defensive Rebounds";
          if(orig_text == "FG3A") tooltip = "3-Point Field Goal Attempts";
          if(orig_text == "FG3M") tooltip = "3-Point Field Goals Made";
          if(orig_text == "FGA") tooltip = "Field Goal Attempts";
          if(orig_text == "FGM") tooltip = "Field Goals Made";
          if(orig_text == "FTA") tooltip = "Free Throw Attempts";
          if(orig_text == "FTM") tooltip = "Free Throws Made";
          if(orig_text == "OREB") tooltip = "Offensive Rebounds";
          if(orig_text == "PF") tooltip = "Personal Fouls";
          if(orig_text == "STL") tooltip = "Steals";
          if(orig_text == "TO") tooltip = "Turnovers";
          label.setAttribute('title', tooltip);
          // console.log(label);
        });
      }, 800);
    }
      
  }, [boxScoresLeft, boxScoresRight]);

  //this function uses the 2 saved box scores to updates the shap values, winning probability and tactical clustering points
  // <float:AST_home>-<float:BLK_home>-<float:DREB_home>-<float:FG3A_home>-<float:FG3M_home>-<float:FGA_home>-<float:FGM_home>-<float:FTA_home>-<float:FTM_home>-<float:OREB_home>-<float:PF_home>-<float:STL_home>-<float:TO_home>_<float:AST_away>-<float:BLK_away>-<float:DREB_away>-<float:FG3A_away>-<float:FG3M_away>-<float:FGA_away>-<float:FGM_away>-<float:FTA_away>-<float:FTM_away>-<float:OREB_away>-<float:PF_away>-<float:STL_away>-<float:TO_away>")
  const updateEverything = () => {
    if(scrolling)return;
    console.log("updateEverything")
 
    let h = boxScoresLeft;
    let a = boxScoresRight;
    //convert box scores to string
    let s: string = "";
    for(let key in h){
      s += h[key].toFixed(4) + "/";
    }
    s = s.slice(0, -1);
    s += "/";
    for(let key in a){
      s += a[key].toFixed(4) + "/";
    }
    s = s.slice(0, -1);


    loadData(`api/shap/${s}`).then(data => {
      // console.log(data);
      setShap(data);
    });


    loadData(`api/prediction/${s}`).then(data => {
      // console.log(data);
      setProbabilityLeft(data["winning_odds_home"]);
    });
    loadData(`api/clustering_advanced_stat/${s}`).then(data => {
      // console.log(data);
      // console.log("COORDINATE OF FIRST POINT:" + data[0]["x_coord"] + " " + data[0]["y_coord"]);
      setPoints(data);
    });
    loadData(`api/similar_games/${s}`).then(data => {
      console.log(data);
      setSimilarMatchups(data);
    });
    loadData(`api/possessions/${s}`).then(data => {
      console.log(data);
      //round to 2 decimal places
      data.home_possessions = Math.round(data.home_possessions * 100) / 100;
      data.away_possessions = Math.round(data.away_possessions * 100) / 100;
      setPossessions(data);
    });
  }




  return (
    <div className="App">
      {/* make all .box elements have the correct bgcolor */}
      <style>
        {`
          .left .box {
            background-color: ${bgColorLeft};
          }
          .right .box {
            background-color: ${bgColorRight};
          }
        `}
      </style>
      {/* <header className="App-header"> Winning odds predictions</header> */}
      <div className="left container">
        <h1 className='side_title'>HOME</h1>
        <TeamSelector title='HOME' availableTeams={availableTeams} selectedTeam={selectedTeamLeft} setSelectedTeam={handleSelectionLeft} setBgColor={setBgColorLeft} />
        {DisplayRestOfApp && <>
          <div className="box sliderbox">
            <h2>Box Scores</h2>
            <ParallelCoordinates data_orig={parallelCoordinatesDataHome} limits={boxScoreBoundaries} custom={boxScoresLeft} scrolling={scrolling}></ParallelCoordinates>
            <BoxScoreSlider boxScores={boxScoresLeft} onSliderChange={handleSliderChangeLeft} onMouseUp={onSliderMouseUp} boxScoreBoundaries={boxScoreBoundaries} />
            <div className="possessions_display">Possessions: {possessions.home_possessions}</div>
          </div>
          <WinChanceDisplay probability={probabilityLeft} />
        </>}
      </div>
      <div className="right container">
        <h1 className='side_title'>AWAY</h1>
        <TeamSelector title='AWAY' availableTeams={availableTeams} selectedTeam={selectedTeamRight} setSelectedTeam={handleSelectionRight} setBgColor={setBgColorRight}/>
        <Popup text=""/>
        {DisplayRestOfApp && <>
          <div className="box sliderbox">
            <h2>Box Scores</h2>
            <ParallelCoordinates data_orig={parallelCoordinatesDataAway} limits={boxScoreBoundaries} custom={boxScoresRight} scrolling={scrolling}></ParallelCoordinates>
            <BoxScoreSlider boxScores={boxScoresRight} onSliderChange={handleSliderChangeRight} onMouseUp={onSliderMouseUp} boxScoreBoundaries={boxScoreBoundaries}/>
            <div className="possessions_display">Possessions: {possessions.away_possessions}</div>
          </div>
          <WinChanceDisplay probability={1-probabilityLeft}/>   
        </>}   
      </div>
      <Steps
          enabled={ShowTeamSelectorPopup && !DISABLE_TUTORIAL}
          steps={[ 
            {title: "Welcome!", element: ".select_HOME", intro: "Welcome to the NBA Matchup Analyzer 👋 <br/> Start by choosing a Home Team for the analysis." }, 
            { element: ".select_AWAY", intro: "Now choose the Away Team to see the results!" } 
          ]}
          initialStep={0}
          onExit={() => { setShowTeamSelectorPopup(false); }}
          //add an exit button to the last step
          options={{ doneLabel: 'Got it' }}
        />
      {DisplayRestOfApp && <>
        <div className="center container">
          <SimilarMatchupsDisplay matchups={SimilarMatchups}/>
          <ShapDisplay param={shap}/>     
          <Scatterplot points={points}/>
        </div>
      </>}
      <Steps
          enabled={ShowRestOfAppPopup && !DISABLE_TUTORIAL && !ShowTeamSelectorPopup}
          steps={[ 
            { title: "Nice!", intro: "Here is a quick walkthrough of what all the elements do." }, 
            { element: ".popup-button", intro: "You can always find more information about the individual elements by clicking the help button." },
            { element: ".box.sliderbox", intro: "Here you can see the aggregated box scores of the selected home team and the 5 teams with the most similar stats. The sliders can be modified to see how different box scores will influence the analysis. If you aren't sure what the labels mean, hover the mouse over them." },
            { element: ".box.winprob", intro: "The winning probability of your selected teams is calculated based on the box score data." },
            { element: "#similarMatchups", intro: "These are the recent matchups of the teams that match the selected box scores most closely. You can hover on the team logos to see the stats of the match." },
            { element: "#shapbox", intro: "This is how our model got to its prediction. Different parameters influence the winning rate in different ways." },
            { element: "#tacticalClustering", intro: "Teams are evaluated on their defensive and offensive performance and are plotted accordingly. You can hover the mouse on the teams to see their stats." },
            { element: ".box.sliderbox", intro: "Thank you for following the tutorial. When you modify one of the sliders, the other elements are updated in real time. Try it out!" },
          ]}
          initialStep={0}
          onExit={() => { setShowRestOfAppPopup(false); localStorage.setItem("DISABLE_TUTORIAL", "true"); }}
          options={{ doneLabel: 'Got it' }}
        /> 
      <div id='tooltip' />
    </div>
  )
}

export default App;
