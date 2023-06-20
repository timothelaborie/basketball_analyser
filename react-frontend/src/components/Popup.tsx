import React, { useState } from 'react';

interface PopupProps {
  text: string;
}

const Popup: React.FC<PopupProps> = ({ text }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <div className="popup-button" onClick={() => setShowPopup(true)}>
        ?
      </div>
      {showPopup && (
        <div className="popup-background" onClick={() => setShowPopup(false)}>
          <div className="popup-text" onClick={(e) => e.stopPropagation()}>
            <body>
              <div>
                  <h1>Help</h1>
                  <div>
                      <h2>App Overview</h2>
                      <p>Welcome to the Basketball Matchups Analysis App!</p>
                      <p>This app allows you to analyze basketball matchups between different teams and gain insights into various statistics and performance metrics.</p>
                      <p>To get started, follow these steps:</p>
                      <ol>
                          <li>Select the home team and away team from the dropdown menus. You can choose from a list of predefined teams or create a custom matchup.</li>
                          <li>Adjust the sliders to set the desired values for different box score statistics. These statistics represent different aspects of the game, such as assists, blocks, rebounds, and more.</li>
                          <li>Explore the visualizations and analysis results presented in the app. The app provides the winning probability of the selected matchup, a display of feature importance using SHAP values, and a scatterplot visualization of offensive and defensive performance.</li>
                      </ol>
                  </div>
                  <div>
                      <h2>Team Selection</h2>
                      <p>Use the dropdown menus to select the home team and away team for the matchup. The available teams are listed in the dropdown options. After selecting the teams, the app will display relevant statistics and analysis specific to the chosen matchup.</p>
                  </div>
                  <div>
                      <h2>Box Score Sliders</h2>
                      <p>The box score sliders allow you to adjust the values for different statistics that contribute to the analysis. Move the sliders to set the desired values for each statistic.
                      As you adjust the sliders, the app will dynamically update the visualizations and analysis results to reflect the changes.
                      The initial box score data are the ones associated with your selected teams. Once you modify the sliders, you are looking at custom data and predictions.
                      Box scores associated to teams are based on their average box score over the previous season's games.
                      Included in the box scores are the following data:</p>
                      <p>Blocks (BLK), Defensive Rebounds (DREB), 3-Point Field Goal Attempts (FG3A), 3-Point Field Goals Made (FG3M), Field Goal Attempts (FGA), Field Goals Made (FGM), 
                      Free Throw Attempts (FTA), Free Throws Made (FTM), Offensive Rebounds (OREB), Personal Fouls (PF), Steals (ST), and Turnovers (TO)</p>
                  </div>
                  <div>
                      <h2>Winning Probability</h2>
                      <p>The winning probability of the selected matchup is calculated using a pre-trained ML model based on LightGBM.
                      The model was trained on matchups of previous seasons, using the box scores of matchups as input and the final score as output.
                      As you adjust the sliders, the winning probability will dynamically update to reflect the changes.</p>
                  </div>
                  <div>
                      <h2>Similar Matchups</h2>
                      <p>The app displays a list of similar matchups based on the selected matchup. This is done by showing the matchups of teams with the smallest distance
                      from the selected matchup in the feature space. The distance is calculated using the Euclidean distance between the box scores of the selected matchup and
                      the box scores of the other matchups.</p>
                  </div>
                  <div>
                      <h2>Feature Importance</h2>
                      <p>The feature importance of the selected matchup is presented in the app using SHAP values.</p>
                      <p>SHAP (SHapley Additive exPlanations) is a game theoretic approach to explain the output of any machine learning model. It connects optimal credit allocation with local explanations using the classic Shapley values from game theory and their related extensions.
                      As you adjust the sliders, the SHAP values will dynamically update to reflect the changes.</p>
                  </div>
                  <div>
                      <h2>League Overview</h2>
                      <p>The league overview provides a scatterplot, ranking each team in the league on its defensive and offensive ratings.
                      </p>
                  </div>
              </div>
            </body>
          </div>
          <button className="popup-enabletutorial" onClick={() => localStorage.setItem("DISABLE_TUTORIAL", "false")}>Re-enable tutorial</button>
        </div>
      )}
    </>
  );
};

export default Popup;