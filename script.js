// Load the nomogram image
const svg = d3.select("#nomogram")
    .attr("width", "100%")
    .attr("height", "100%");

svg.append("image")
    .attr("xlink:href", "nomogram.jpeg")  // Make sure this path is correct
    .attr("width", "100%")
    .attr("height", "100%");

// Initial positions for markers
let markers = {
    tumor_size: null,
    primary_site_risk: null,
    differentiation: null,
    subcutaneous_invasion: null,
    perineural_invasion: null,
    immunosuppression: null
};

// Initial position for the sum markers
let sumPosition = 0;

// Function to check if all markers are set
function allMarkersSet() {
    return Object.values(markers).every(value => value !== null && value !== "");
}

// Dummy function to calculate position on nomogram and probability
function calculatePosition(value, variable) {
    let position;
    if (variable === "tumor_size") {
        if (value === "<2 cm") {
            position = 260;
        } else if (value === "2-4 cm") {
            position = 564;
        } else if (value === ">= 4 cm") {
            position = 859;
        }
    } else if (variable === "primary_site_risk") {
        if (value === "low") {
            position = 260;
        } else if (value === "medium") {
            position = 298;
        } else if (value === "high") {
            position = 451;
        }
    } else if (variable === "differentiation") {
        if (value === "well to moderately differentiated") {
            position = 260;
        } else if (value === "poorly differentiated") {
            position = 472;
        }
    } else if (variable === "subcutaneous_invasion") {
        if (value === "yes") {
            position = 570;
        } else if (value === "no") {
            position = 260;
        }
    } else if (variable === "perineural_invasion") {
        if (value === "yes") {
            position = 620;
        } else if (value === "no") {
            position = 260;
        }
    } else if (variable === "immunosuppression") {
        if (value === "none/unknown") {
            position = 260;
        } else if (value === "HIV/NHL/other") {
            position = 466;
        } else if (value === "CLL/transplant") {
            position = 626;
        }
    } else {
        // Default position if no match found
        position = Math.random() * 500;
    }
    return position;
}

// Logistic regression model coefficients
const modelParams = {
    intercept: -6.2208973,
    preop_max_4: 3.2500156,
    preop_max_2_4: 1.6511590,
    p_site_risk_H: 1.0434334,
    p_site_risk_M: 0.2058281,
    Differentiation_poorly: 1.1481378,
    SubQ_Invasion_Yes: 1.6853198,
    PNI_Yes: 1.9425454,
    Immunosuppression_HIV_NHL_Other: 1.1225877,
    Immunosuppression_CLL_Transplant: 1.9826142
};

// Function to calculate probability using logistic regression model
function calculateProbability(markers) {
    let logit = modelParams.intercept;
    
    logit += modelParams.preop_max_4 * (markers.tumor_size === ">= 4 cm" ? 1 : 0);
    logit += modelParams.preop_max_2_4 * (markers.tumor_size === "2-4 cm" ? 1 : 0);
    logit += modelParams.p_site_risk_H * (markers.primary_site_risk === "high" ? 1 : 0);
    logit += modelParams.p_site_risk_M * (markers.primary_site_risk === "medium" ? 1 : 0);
    logit += modelParams.Differentiation_poorly * (markers.differentiation === "poorly differentiated" ? 1 : 0);
    logit += modelParams.SubQ_Invasion_Yes * (markers.subcutaneous_invasion === "yes" ? 1 : 0);
    logit += modelParams.PNI_Yes * (markers.perineural_invasion === "yes" ? 1 : 0);
    logit += modelParams.Immunosuppression_HIV_NHL_Other * (markers.immunosuppression === "HIV/NHL/other" ? 1 : 0);
    logit += modelParams.Immunosuppression_CLL_Transplant * (markers.immunosuppression === "CLL/transplant" ? 1 : 0);
    
    // Calculate probability using logistic function
    const probability = 1 / (1 + Math.exp(-logit));
    return probability.toFixed(2);
}

// Define y positions for each row
const yPositions = {
    tumor_size: 202,
    primary_site_risk: 251,
    differentiation: 301,
    subcutaneous_invasion: 351,
    perineural_invasion: 401,
    immunosuppression: 450
};

// Function to calculate the sum dot position
function calculateSumPosition() {
    let sum = 0;
    for (let variable in markers) {
        if (markers[variable] !== null && markers[variable] !== "") {
            // Placeholder values - replace with actual point values
            let pointValue;
            if (variable === "tumor_size") {
                if (markers[variable] === "<2 cm") {
                    pointValue = 0;
                } else if (markers[variable] === "2-4 cm") {
                    pointValue = 51;
                } else if (markers[variable] === ">= 4 cm") {
                    pointValue = 100;
                }
            } else if (variable === "primary_site_risk") {
                if (markers[variable] === "low") {
                    pointValue = 0;
                } else if (markers[variable] === "medium") {
                    pointValue = 7;
                } else if (markers[variable] === "high") {
                    pointValue = 33;
                }
            } else if (variable === "differentiation") {
                if (markers[variable] === "well to moderately differentiated") {
                    pointValue = 0;
                } else if (markers[variable] === "poorly differentiated") {
                    pointValue = 35;
                }
            } else if (variable === "subcutaneous_invasion") {
                if (markers[variable] === "yes") {
                    pointValue = 52;
                } else if (markers[variable] === "no") {
                    pointValue = 0;
                }
            } else if (variable === "perineural_invasion") {
                if (markers[variable] === "yes") {
                    pointValue = 60;
                } else if (markers[variable] === "no") {
                    pointValue = 0;
                }
            } else if (variable === "immunosuppression") {
                if (markers[variable] === "none/unknown") {
                    pointValue = 0;
                } else if (markers[variable] === "HIV/NHL/other") {
                    pointValue = 35;
                } else if (markers[variable] === "CLL/transplant") {
                    pointValue = 61;
                }
            }
            sum += pointValue;
        }
    }
    // Max out sum at 350 points to not exceed the span of the line on the nomogram
    if (sum > 300) { sum = 300; }
    // Modify sum so the position is correctly scaled onto the "total points" row.
    // "total points" row start position == 260 px (0 points)
    // "total points" row end position == 859 px (300 points)
    // Linear transformation formula: y = 1.9967 * x + 260
    sum = 1.9967 * sum + 260;
    return sum;
}

// Function to determine AJCC8 Stage
function determineAJCC8Stage(markers) {
    if (markers.tumor_size === ">= 4 cm" || markers.perineural_invasion === "yes" || markers.subcutaneous_invasion === "yes") {
        return "T3";
    } else if (markers.tumor_size === "2-4 cm") {
        return "T2";
    } else {
        return "T1";
    }
}

// Function to determine BWH Stage
function determineBWHStage(markers) {
    let riskFactors = 0;
    if (markers.tumor_size === "2-4 cm" || markers.tumor_size === ">= 4 cm") riskFactors++;
    if (markers.differentiation === "poorly differentiated") riskFactors++;
    if (markers.perineural_invasion === "yes") riskFactors++;
    if (markers.subcutaneous_invasion === "yes") riskFactors++;

    if (riskFactors === 4) {
        return "T3";
    } else if (riskFactors === 2 || riskFactors === 3) {
        return "T2b";
    } else if (riskFactors === 1) {
        return "T2a";
    } else {
        return "T1";
    }
}

// Update markers and dashed lines
function updateMarkers() {
    for (let variable in markers) {
        if (markers[variable] !== null && markers[variable] !== "" && markers[variable] !== "select " + variable.replace(/_/g, " ")) {
            const position = calculatePosition(markers[variable], variable);
            const yPos = yPositions[variable];

            // Update marker
            svg.select(`#marker-${variable}`)
                .attr("cx", position)
                .attr("cy", yPos)
                .style("visibility", "visible");

            // Update or create dashed line
            if (svg.select(`#line-${variable}`).empty()) {
                svg.append("line")
                    .attr("id", `line-${variable}`)
                    .attr("x1", position)
                    .attr("y1", yPos)
                    .attr("x2", position)
                    .attr("y2", 151)  // Extend upwards to 150
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)  // Increased stroke width
                    .attr("stroke-dasharray", "5,5")
                    .style("visibility", "visible");
            } else {
                svg.select(`#line-${variable}`)
                    .attr("x1", position)
                    .attr("y1", yPos)
                    .attr("x2", position)
                    .attr("y2", 151)  // Extend upwards to 150
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)  // Increased stroke width
                    .style("visibility", "visible");
            }
        } else {
            // Hide marker and line if default option is selected
            svg.select(`#marker-${variable}`).style("visibility", "hidden");
            svg.select(`#line-${variable}`).style("visibility", "hidden");
        }
    }

    // Update sum marker positions
    sumPosition = calculateSumPosition();

    svg.select("#sum-marker")
        .attr("cx", sumPosition)
        .attr("cy", 500)
        .style("visibility", "visible");

    let cappedSumPosition = Math.min(sumPosition, 728);
    svg.select("#sum-marker-bottom")
        .attr("cx", cappedSumPosition)
        .attr("cy", 550)
        .style("visibility", "visible");

    // Calculate and display probability
    const probability = calculateProbability(markers);
    console.log('Probability (decimal):', probability); // Debugging line
    let percentage = Math.round(probability * 100);
    console.log('Probability (percentage):', percentage + "%"); // Debugging line

    // Check if the percentage is greater than 80
    if (percentage > 80) {
        percentage = ">80%";
    } else {
        percentage = percentage + "%";
    }

// Display the probability
d3.select("#probability").text(percentage);


    // Determine and display AJCC8 Stage
    const ajcc8Stage = determineAJCC8Stage(markers);
    d3.select("#ajcc8-stage").text(ajcc8Stage);

    // Determine and display BWH Stage
    const bwhStage = determineBWHStage(markers);
    d3.select("#bwh-stage").text(bwhStage);
}

// Create markers and dashed lines for each variable
Object.keys(markers).forEach(variable => {
    svg.append("circle")
        .attr("id", `marker-${variable}`)
        .attr("r", 5)
        .attr("cx", -20)  // Positioned off-screen initially
        .attr("cy", -20)  // Positioned off-screen initially
        .style("fill", "red")
        .style("visibility", "hidden");  // Hidden initially

    svg.append("line")
        .attr("id", `line-${variable}`)
        .attr("x1", -20)  // Positioned off-screen initially
        .attr("y1", -20)  // Positioned off-screen initially
        .attr("x2", -20)  // Positioned off-screen initially
        .attr("y2", -20)  // Positioned off-screen initially
        .attr("stroke", "red")
        .attr("stroke-width", 2)  // Increased stroke width
        .attr("stroke-dasharray", "5,5")
        .style("visibility", "hidden");  // Hidden initially
});

// Create the sum markers
svg.append("circle")
    .attr("id", "sum-marker")
    .attr("r", 5)
    .attr("cx", -20)  // Positioned off-screen initially
    .attr("cy", 561)
    .style("fill", "blue")
    .style("visibility", "hidden");  // Hidden initially

svg.append("circle")
    .attr("id", "sum-marker-bottom")
    .attr("r", 5)
    .attr("cx", -20)  // Positioned off-screen initially
    .attr("cy", 559)
    .style("fill", "blue")
    .style("visibility", "hidden");  // Hidden initially

// Add event listeners to drop-down menus
d3.selectAll(".dropdown").on("change", function() {
    const variable = this.id;
    const value = this.value;
    markers[variable] = value;
    updateMarkers();
});
