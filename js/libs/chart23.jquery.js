/**************************************/
/*                                    */
/* KERN23 Charts                      */
/* v2.0                               */
/*                                    */
/* Author:  Hendrik Reimers           */
/* Company: KERN23                    */
/* Web:     www.kern23.de             */
/*                                    */
/**************************************/

$(function($) { $.fn.chart23 = function(options) { $(this).each(function() {
	
	var table           = $(this),
		canvas          = $('<canvas>'),
		settings        = options || {},
		
		numSteps        = 0,
		pxPerStep       = 0,
		
		data            = new Array(),
		dataText        = new Array(),
		labels          = new Array(),
		
		pointMax        = 0,
		pointMin        = 0,
		pointNull       = null,
		
		numCols         = 0,
		numBarsPerBlock = 0,
		
		chartHeight     = 0,
		chartWidth      = 0,
		
		hintBoxActive   = false,
		
		
		
		/* SETTINGS */
		
		cWidth          = table.data('chartwidth')      || settings.chartWidth      || table.width(),
		cHeight         = table.data('chartheight')     || settings.chartHeight     || table.height(),
		
		margin          = table.data('margin')          || settings.margin          || {outer:40,blockMargin:0.25,barMargin:0.15},
		
		fontSize        = table.data('fontsize')        || settings.fontSize        || '12',
		fontColor       = table.data('fontcolor')       || settings.fontColor       || '#000',
		fontFamily      = table.data('fontfamily')      || settings.fontFamily      || 'Arial, Helvetica, sans-serif',
		
		steps           = table.data('steps')           || settings.steps           || '5',
		
		strokeStyle     = table.data('strokestyle')     || settings.strokeStyle     || '#cfcfcf',
		strokeWidth     = table.data('strokewidth')     || settings.strokeWidth     || '1',
		
		gridStrokeStyle = table.data('gridstrokestyle') || settings.gridStrokeStyle || '#cfcfcf',
		gridStrokeWidth = table.data('gridstrokewidth') || settings.gridStrokeWidth || '0.25',
		gridMargin      = table.data('gridmargin')      || settings.gridMargin      || 0,
		
		chartType       = table.data('charttype')       || settings.chartType       || 'bars',
		
		colorSet        = table.data('colorset')        || settings.colorSet        || ['lightblue','lightcoral','lightgreen','LightGoldenRodYellow ','SandyBrown'],
		
		hintBoxWidth    = table.data('hintboxwidth')    || settings.hintBoxWidth    || 180,
		hintBoxHeight   = table.data('hintboxheight')   || settings.hintBoxHeight   || 100,
		hintBoxOffset   = table.data('hintboxoffset')   || settings.hintBoxOffset   || 10,
		
		lineArcStrength = table.data('linearcstrength') || settings.lineArcStrength || 3,
		
		enableLineShift = table.data('enablelineshift') || settings.enableLineShift || false;
	
	
	
	/**
	 * Init function
	 *
	 */
	var init = function() {
		// Create the data array with the number values
		createDataArray();
		
		// Get highest and lowest value in data array
		var flat = data.join().split(',');
		pointMax = Math.round(Math.max.apply(Math, flat)),
		pointMin = Math.round(Math.min.apply(Math, flat));
		
		while (pointMax%5 != 0) pointMax++;
		while (pointMin%5 != 0) pointMin--;
		
		// Create the canvas element
		createCanvas();
		
		// Draw the chart
		switch ( chartType ) {
			case 'bars':
				drawGrid();
				drawBars();
				break;
			case 'lines':
				drawGrid();
				drawLines();
				break;
			case 'pies':
				drawPies();
				break;
		};
		
		// Draw the hint box on top
		drawHintBox();
		
		return table;
	};
	
	/**
	 * Creates the data array
	 *
	 */
	var createDataArray = function() {
		var regex = /[+-]?\d+/g;
		
		// Test if header position is on the left
		if ( (table.find('tr:first > th').length > 0) && (table.find('tr:first > td').length > 0) ) {
			table.find('tr > th').each(function(row, th) {
				labels[row]   = $(th).text();
				data[row]     = new Array();
				dataText[row] = new Array();
				
				table.find('tr:nth-child(' + (row + 1) + ') td').each(function(col, cell) {
					var cellText = $(cell).text();
					var nr       = cellText.match(regex) || 0;
					
					data[row][col]     = parseFloat(( nr.length > 0 ) ? nr.join('.') : nr);
					dataText[row][col] = cellText;
				});
			});
		} else {
			table.find('tr:first th').each(function(col, th) {
				labels[col]   = $(th).text();
				data[col]     = new Array();
				dataText[col] = new Array();
				
				table.find('tr td:nth-child(' + (col + 1) + ')').each(function(row, cell) {
					var cellText = $(cell).text();
					var nr       = cellText.match(regex) || 0;
					
					data[col][row]     = parseFloat(( nr.length > 0 ) ? nr.join('.') : nr);
					dataText[col][row] = cellText;
				});
			});
		}
		numCols         = data.length;
		numBarsPerBlock = data[0].length;
	};
	
	/**
	 * Basicly creates the canvas element
	 *
	 */
	var createCanvas = function() {
		canvas.attr({
			width:  cWidth,
			height: cHeight
		}).addClass(table.attr('class'));
		
		table.after(canvas);
	};
	
	/**
	 * Draws the grid
	 *
	 */
	var drawGrid = function() {
		var curGridText = pointMax,
			distance    = Math.sqrt(Math.pow(pointMax - pointMin,2));
		
		distance  = pointMax - pointMin;
		numSteps  = (distance / steps) + 2;
		pxPerStep = Math.floor((cHeight - fontSize - margin.outer) / numSteps) + (gridMargin / 2);
		
		for ( var lineNum = 0; lineNum < numSteps-1; lineNum++ ) {
			var px1 = margin.outer,
				py1 = lineNum * pxPerStep + margin.outer,
				px2 = Math.ceil(cWidth - margin.outer),
				py2 = lineNum * pxPerStep + margin.outer;
			
			// Draw the grid line
			canvas.drawLine({
				'layer':       true,
				'groups':      ['grid'],
				'strokeStyle': gridStrokeStyle,
				'strokeWidth': gridStrokeWidth,
				'x1':          px1,
				'y1':          py1,
				'x2':          px2,
				'y2':          py2
			});
			
			// Draw the grid text
			canvas.drawText({
				'layer':       true,
				'groups':      ['grid'],
				'fillStyle':   fontColor,
				'strokeWidth': 1,
				'fontSize':    fontSize,
				'fontFamily':  fontFamily,
				'text':        curGridText,
				'x':           px1 - margin.outer / 2,
				'y':           py1
			});
			
			// Set the zero point
			if ( ((curGridText - steps) < 0) && pointNull == null ) pointNull = py1;
			
			// Set the next grid text
			curGridText -= steps;
		}
		
		// Calculate the inner size of the chart
		chartWidth  = cWidth - margin.outer * 2;
		chartHeight = (numSteps-2) * pxPerStep;
	};
	
	/**
	 * Draws the hint box
	 *
	 */
	var drawHintBox = function() {
		// Draw the hint box
		canvas.drawRect({
			layer:     true,
			groups:    ['hintBox'],
			name:      'hintBoxBox',
			fillStyle: '#000',
			x:         0,
			y:         0,
			width:     hintBoxWidth / 2,
			height:    hintBoxHeight / 2,
			opacity:   0.5,
			fromCenter: true,
			visible:   false
		});
		
		canvas.drawText({
			layer:      true,
			groups:     ['hintBox'],
			name:       'hintBoxText',
			fillStyle:  '#fff',
			fontSize:   fontSize,
			fontFamily: fontFamily,
			text:       'XXX\nYYY',
			x:          hintBoxWidth / 2,
			y:          hintBoxHeight / 2,
			fromCenter: true,
			visible:    false,
		});
		
		// Handle mouse move events
		canvas.mousemove(function(evt) {
			moveHint(evt);
		});
	};
	
	/**
	 * Toggles the hint box following the mouse
	 *
	 */
	var toggleHint = function(layer) {
		if ( hintBoxActive == false ) {
			hintBoxActive = true;
			
			// Set the new text
			canvas.setLayer('hintBoxText', {
				text: layer.data.label + '\n' + layer.data.text,
			}).setLayerGroup('hintBox', {
				visible: true
			}).addClass('hover');
		} else {
			hintBoxActive = false;
		
			// Hide the box
			canvas.setLayerGroup('hintBox', {
				visible: false
			}).removeClass('hover');
		}
	};
	
	/**
	 * Moves the hint box
	 *
	 */
	var moveHint = function(evt) {
		var cOffset = canvas.offset(),
			relX = evt.pageX - cOffset.left,
			relY = evt.pageY - cOffset.top;
		
		// Box on left or right
		if ( (relX + hintBoxWidth + hintBoxOffset) > cWidth ) {
			var posX = relX - hintBoxOffset - hintBoxWidth / 4;
		} else {
			var posX = relX + hintBoxOffset + hintBoxWidth / 4;
		}
		
		// Box on top or bottom
		if ( (relY + hintBoxHeight + hintBoxOffset) > cHeight ) {
			var posY = relY - hintBoxOffset - hintBoxHeight / 4;
		} else {
			var posY = relY + hintBoxOffset + hintBoxHeight / 4;
		}
		
		// move it
		canvas.setLayerGroup('hintBox', {
			x: posX,
			y: posY
		});
	};
	
	
	
	/**
	 * Draws the bars
	 *
	 */
	var drawBars = function() {
		var numBlocks   = data.length,
			marginRoom  = chartWidth * margin.blockMargin,
			blockWidth  = (chartWidth - marginRoom) / numBlocks,
			marginWidth = marginRoom / (numBlocks + 1),
			
			marginRoomPerBlock = blockWidth * margin.barMargin,
			barWidth           = (blockWidth - marginRoomPerBlock) / data[0].length,
			barMarginWidth     = data[0].length > 1 ? (marginRoomPerBlock / (data[0].length-1)) : 0;
		
		for ( var groupKey = 0; groupKey < numBlocks; groupKey++ ) {
			var pointList   = data[groupKey],
				textList    = dataText[groupKey],
				blockPos    = margin.outer+ (marginWidth * (groupKey + 1)) + (blockWidth * groupKey),
				curColorKey = 0;
			
			for ( var i = 0; i < pointList.length; i++ ) {
				var barHeight = pointList[i] * (chartHeight / (pointMax - pointMin));
				if (Math.abs(barHeight) < 1) barHeight = 1;
				
				var barPosX = blockPos + ( barMarginWidth + barWidth ) * i,
					barPosY = pointNull - barHeight,
					txtPosX = blockPos + blockWidth * 0.5,
					txtPosY = chartHeight + margin.outer + fontSize * 1.5;
				
				canvas.drawRect({
					layer:      true,
					groups:     ['bars','bar' + groupKey],
					fromCenter: false,
					fillStyle:  colorSet[curColorKey],
					x:          barPosX,
					y:          barPosY,
					width:      barWidth,
					height:     barHeight,
					
					data:       {
						value: pointList[i],
						label: labels[groupKey],
						text:  textList[i]
					},
					
					mouseover: function(layer) {
						toggleHint(layer);
					},
					mouseout: function(layer) {
						toggleHint(layer);
					}
				});
				
				// Set the new color value for the bar or start again
				curColorKey = ( (curColorKey + 1) >= colorSet.length ) ? 0 : curColorKey + 1;
			}
			
			// Draw the labels
			canvas.drawText({
				layer:      true,
				groups:     ['labels'],
				name:       labels[groupKey],
				fillStyle:  fontColor,
				x:          txtPosX,
				y:          txtPosY,
				fontSize:   fontSize,
				fontFamily: fontFamily,
				text:       labels[groupKey]
			});
		}
	};
	
	/**
	 * Draws the lines
	 *
	 */
	var drawLines = function() {
		var numBlocks   = data.length,
			curColorKey = 0;
		
		for ( var groupKey = 0; groupKey < numBlocks; groupKey++ ) {
			var pointList   = data[groupKey],
				textList    = dataText[groupKey],
				pointMargin = chartWidth / (pointList.length - 1),
				distance    = 0;
			
			if ( enableLineShift == true ) {
				pointMargin = chartWidth / ((pointList.length - 1) + margin.blockMargin * groupKey),
				distance    = chartWidth - (pointMargin * (pointList.length - 1));
			}
			
			// Line preset
			var curLine = {
				layer:       true,
				groups:      ['lines','line' + groupKey],
				strokeStyle: colorSet[curColorKey],
				strokeWidth: strokeWidth,
				data:        {value: [], text: []}
			};
			
			// Set the line points
			for ( var i = 0; i < pointList.length; i++ ) {
				var curPoint = pointList[i];
				
				var barHeight = pointList[i] * (chartHeight / (pointMax - pointMin));
				if (Math.abs(barHeight) < 1) barHeight = 1;
				
				curLine['x' + (i + 1)] = (pointMargin * i) + margin.outer + distance;
				curLine['y' + (i + 1)] = pointNull - barHeight;
				
				curLine.data.value[i] = curPoint;
				curLine.data.text[i]  = textList[i];
			}
			
			// Draw the line
			canvas.drawLine(curLine);
			
			// Preset of the circles
			var curArc = {
				strokeStyle: colorSet[curColorKey],
				fillStyle:   colorSet[curColorKey],
				layer:       true,
				groups:      ['lines', 'lineCircle' + groupKey,'line' + groupKey],
				radius:      strokeWidth * lineArcStrength,
				start:       0,
				end:         360,
				
				data:       {label: labels[groupKey]},
					
				mouseover: function(layer) {
					toggleHint(layer);
				},
				mouseout: function(layer) {
					toggleHint(layer);
				}
			};
			
			// Draw the circles
			$.each(curLine, function(key, val) {
				if ( (key[0] == 'x') ) {
					curArc['x'] = curLine['x' + key[1]];
					curArc['y'] = curLine['y' + key[1]];
					
					curArc.data.value = curLine.data.value[key[1] - 1];
					curArc.data.text  = curLine.data.text[key[1] - 1];
					
					canvas.drawArc(curArc);
				}
			});
			
			// Label positioning
			var txtPosX     = (chartWidth / numBlocks) * (groupKey + 1),
				txtPosY     = chartHeight + margin.outer + fontSize * 1.5,
				txtRectSize = 5;
			
			// Label drawing
			canvas.drawText({
				layer:      true,
				groups:     ['labels'],
				name:       labels[groupKey],
				fillStyle:  fontColor,
				align:      'center',
				x:          txtPosX,
				y:          txtPosY,
				fontSize:   fontSize,
				fontFamily: fontFamily,
				text:       labels[groupKey]
			}).drawRect({
				layer:      true,
				groups:     ['labels'],
				fromCenter: false,
				fillStyle:  colorSet[curColorKey],
				x:          txtPosX - (canvas.measureText(labels[groupKey]).width / 2) - (txtRectSize * 2),
				y:          txtPosY - (canvas.measureText(labels[groupKey]).height / 2) + (txtRectSize / 2),
				width:      txtRectSize,
				height:     txtRectSize
			});
			
			// Set the new color value for the bar or start again
			curColorKey = ( (curColorKey + 1) >= colorSet.length ) ? 0 : curColorKey + 1;
		}
	};
	
	/**
	 * Draws the pie charts
	 *
	 */
	var drawPies = function() {
		// calculate the maximum radius you can use
		var numberOfSections       = data.length,
			width                  = cWidth - margin.outer,
			height                 = cHeight - margin.outer,
			R                      = Math.sqrt(((width * height) / numberOfSections))/2,
			MX                     = Math.round(width / (R * 2)), // max amount of sqares that can fit on the width
			MY                     = Math.round(height / (R * 2)), // max amount of sqares that can fit on the height
			skipLast               = 0,
			pieNum                 = 0,
			numOfCalculatedCircles = MX * MY,
			curColorKey            = 0;
			
		if ( numOfCalculatedCircles != numberOfSections ) {
			if ( numOfCalculatedCircles < numberOfSections ) {
				MX = MX + Math.ceil((numberOfSections - numOfCalculatedCircles) / MY);
				
				if ( MX * MY != numberOfSections ) skipLast = Math.abs( MX  *MY - numberOfSections);
			} else skipLast = numOfCalculatedCircles - numberOfSections;
		}
		
		if ( R * 2 * MX > width )  R = (width / 2) / MX;  // recalculate the radius for X
		if ( R * 2 * MY > height ) R = (height / 2) / MY; // recalculate the radius for Y
		
		// Reduce the drawing radius with the circles margin
		radiusToDraw = R - margin.outer * margin.blockMargin;
		
		var circlesWidth  = R * 2 * MX,
			circlesHeight = R * 2 * MY,
			marginX = 0,
			marginY = 0;
		
		if ( circlesWidth < width )   marginX = (width - circlesWidth) / 2;
		if ( circlesHeight < height ) marginY = (height - circlesHeight) / 2;
		
		var RY = marginY + R + margin.outer / 3;
		
		for ( var i = 0; i < MY; i++ ) {
			var RX = marginX + R + margin.outer / 2;
		
			for ( var j = 0; j < MX; j++ ) {
				if ( (i === MY - 1) && (j === MX - skipLast) ) break;
								
				// Get total of data array
				var curTotal = data[pieNum].reduce(function(pv, cv) { return parseFloat(pv) + parseFloat(( cv < 0 ) ? cv * -1 : cv) }, 0);
				
				// Draw the data
				var lastEnd = 0;
				for ( var dKey = 0; dKey < data[pieNum].length; dKey++ ) {
					var curVal = ( data[pieNum][dKey] < 0 ) ? data[pieNum][dKey] * -1 : data[pieNum][dKey];
					
					// Draw the pie
					canvas.drawPath({
						layer:       true,
						groups:      ['pies', 'pie' + pieNum, 'pieData' + dKey],
						fromCenter:  true,
						fillStyle:   colorSet[curColorKey],
						strokeWidth: strokeWidth,
						strokeStyle: strokeStyle,
						closed:      true,
						x:           RX,
						y:           RY,
						
						data:        {
							value: data[pieNum][dKey],
							label: labels[pieNum],
							text:  dataText[pieNum][dKey]
						},
						
						p1: {
							type: 'line',
							x1:   0,
							y1:   0
						},
						
						p2: {
							type:       'arc',
							radius:     radiusToDraw,
							x:          0,
							y:          0,
							start:      lastEnd * (180 / Math.PI),
							end:        (lastEnd + (Math.PI * 2 * (curVal / curTotal))) * (180 / Math.PI),
						},
						
						mouseover: function(layer) {
							toggleHint(layer);
						},
						mouseout: function(layer) {
							toggleHint(layer);
						}
					});
					
					lastEnd    += Math.PI * 2 * (curVal / curTotal);
					curColorKey = ( (curColorKey + 1) >= colorSet.length ) ? 0 : curColorKey + 1;
				}
				
				// Draw the label
				canvas.drawText({
					layer:      true,
					groups:     ['labels'],
					name:       labels[pieNum],
					fillStyle:  fontColor,
					align:      'center',
					x:          RX,
					y:          RY + R,
					fontSize:   fontSize,
					fontFamily: fontFamily,
					text:       labels[pieNum]
				});
				
				// New position
				RX += 2 * R;
				
				// Pull up the current data key
				pieNum++;
			}
			
			// New position
			RY += 2 * R;
		}
	};
	
	
	
	// Let's do some magic
	return init();
	
})}});