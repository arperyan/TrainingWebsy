var config = {
  schema: schema,
  session: {
    host: "localhost",
    port: 4848,
    prefix: "",
    unsecure: true
  }
};

var senseObjects = {};

var sDef = {
  qInfo: {
    qType: "CurrentSelections"
  },
  qSelectionObjectDef:{}
}

var pieDef = {
  qInfo: {
    qType: "Pie Chart"
  },
  qHyperCubeDef: {
    qDimensions: [{
      qDef: {
        qFieldDefs: ["CategoryName"],
        qSortCriterias:[{
          qSortByAscii: 1 //sort alphabetically ASC
        }]
      }
    }],
    qMeasures: [{
      qDef: {
        qDef: "=Sum(OrderLineAmount)"
      },
      qSortby:{
        qSortByNumeric: -1  //sort by value DESC
      }
    }],
    qInitialDataFetch: [{
      qTop: 0,
      qLeft: 0,
      qWidth: 2,
      qHeight: 50
    }],
    qInterColumnSortOrder: [1,0]
  }
};

var barDef = {
  qInfo: {
    qType: "Bar Chart"
  },
  qHyperCubeDef: {
    qDimensions: [{
      qDef: {
        qFieldDefs: ["Year"],
        }
    }],
    qMeasures: [{
      qDef: {
        qDef: "=Sum(OrderLineAmount)"
      }
    }],
    qInitialDataFetch: [{
      qTop: 0,
      qLeft: 0,
      qWidth: 2,
      qHeight: 20
    }]
  }
};

var lineDef = {
  qInfo: {
    qType: "Line Chart"
  },
  qHyperCubeDef: {
    qDimensions: [{
      qDef: {
        qFieldDefs: ["WeekYear"],
        qSortCriterias:[{
          qSortByAscii: 1 //sort alphabetically ASC
        }]
      }
    }],
    qMeasures: [{
      qDef: {
        qDef: "=Sum(OrderLineAmount)"
      },
      qSortby:{
        qSortByNumeric: -1  //sort by value DESC
      }
    }],
    qInitialDataFetch: [{
      qTop: 0,
      qLeft: 0,
      qWidth: 2,
      qHeight: 100
    }],
    qInterColumnSortOrder: [1,0]
  }
};






function logError(err){
  console.log(err);
}

enigma.getService('qix', config).then(function(qlik){
  //console.log(qlik);
  qlik.global.openApp('WBY Sales.qvf').then(function(app){
    //console.log(app);
    app.createSessionObject(pieDef).then (function (objModel){
      //console.log(objModel);
      senseObjects.pie = objModel;
      renderPie();
    });
    app.createSessionObject(barDef).then (function (objModel){
      senseObjects.bar = objModel;
      renderBar();
    });
    app.createSessionObject(sDef).then(function(objModel){
      senseObjects.currentSelectons = objModel;
      renderCurrentSelections();
    });
  });
}, logError);



function renderPie() {
  senseObjects.pie.getLayout().then (function (layout){
    if(layout.qHyperCube.qDataPages[0]){
      var senseData = layout.qHyperCube.qDataPages[0].qMatrix;
      amData =[];
      for (var i=0;i<senseData.length;i++){
        amData.push({
          dim: senseData[i][0].qText,
          elemNumber: senseData[i][0].qElemNumber,
          exp: senseData[i][1].qNum
        });
      }
      var chart = AmCharts.makeChart("PIE", {
        type: "pie",
        theme: "light",
        valueAxes: [{
          axisAlpha: 1

        }],
        innerRadius: "50%",
        dataProvider: amData,
        titleField: "dim",
        valueField: "exp",
        addClassNames: true,
        //labelText: "[[dim]]",
        legend: {
          position:"right",
          marginRight: 100,
          autoMargins: false,
          valueText: "[[percents]]%"
        },
        startDuration: 1,
        titles: [{
          text: "First Pie"
        }],
        defs: {
          filter: [{
            id: "shadow",
            width: "200%",
            height: "200%",
          feOffset: {
            result: "offOut",
            in: "SourceAlpha",
            dx: 0,
            dy: 0
          },
          feGaussianBlur: {
            result: "blurOut",
            in: "offOut",
            stdDeviation: 5
          },
          feBlend: {
            in: "SourceGraphic",
            in2: "blurOut",
            mode: "normal"
          }
        }]
      },
        listeners: [{
           event: "init",
           method: function(event) {
            // apply slice colors to their labels
            var chart = event.chart;
            if (chart.labelColorField === undefined)
              chart.labelColorField = "labelColor";
              for(var i = 0; i < chart.chartData.length; i++) {
                chart.dataProvider[i][chart.labelColorField] = chart.chartData[i].color;
              }
            chart.validateData();
            chart.animateAgain();
          }
        },{
          event: "clickSlice",
          method: function(vis){
            var elemNumber = vis.dataItem.dataContext.elemNumber;
            selectValues("pie", 0, [elemNumber]);
          }
        }],

      });


      chart.addListener("rollOverSlice", function(e) {
        handleRollOver(e);
       });

       function handleInit(){
         chart.legend.addListener("rollOverItem", handleRollOver);
       }

       function handleRollOver(e){
        var wedge = e.dataItem.wedge.node;
        wedge.parentNode.appendChild(wedge);
      }

    }
  })
}

function renderCurrentSelections(){
  senseObjects.currentSelectons.getLayout().then(function(layout){
    var selections = layout.qSelectionObject.qSelections;
    var html = "";
    for(var i=0; i<selections.length; i++){
      html += "<li>";
      html += "<label>"
      html += selections[i].qField;
      html += "</label>"
      html += selections[i].qSelected;
      html += "</li>";
    }
    document.getElementById('currSelections').innerHTML = html;
  });
}

function renderBar(){
  senseObjects.bar.getLayout().then(function(layout){
    if(layout.qHyperCube.qDataPages[0]){
      var senseData = layout.qHyperCube.qDataPages[0].qMatrix;
      var amData = [];
      for(var i=0; i<senseData.length; i++){
        amData.push(
          {
            dim: senseData[i][0].qText,
            elemNumber: senseData[i][0].qElemNumber,
            value: senseData[i][1].qNum
          }
        );
      }
      AmCharts.makeChart("BAR", {
        type: "serial",
        dataProvider: amData,
        graphs: [{
          balloonText: "[[category]]: <b>[[value]]</b>",
          fillAlphas: 1,
          type: "column",
          valueField: "value"
        }],
        categoryField: "dim",
        listeners: [{
          event: "clickGraphItem",
          method: function(vis){
            var elemNumber = vis.item.dataContext.elemNumber;
            selectValues("bar", 0, [elemNumber]);
          }
        }]
      });
    }
  });
}

function selectValues(object, column, values){
  senseObjects[object].selectHyperCubeValues("/qHyperCubeDef", column, values, true).then(function(){
    //loop through all hypercubes defined by senseObjects and redraw
      renderPie();
      renderBar();
      renderCurrentSelections();
  });
}

function container() {
          mapael({
              map: {
                  name: "world_countries"
              }
      });
}
