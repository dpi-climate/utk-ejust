import * as d3 from "d3";

// Represents the D3 specification
export class D3Expec {
    
    _svgSelector: any;
    _svg: any;

    constructor(svgSelector: any){
        this._svgSelector = svgSelector;
    }

    async run(data: any, plotWidth: number, plotHeight: number, plotType: number){

        this._svg = d3.select(this._svgSelector);

        // clear svg
        this._svg.html("");

        if(plotType == 0){
            await this.runD3Code0(data, plotWidth, plotHeight);
        }else if(plotType == 1){
            await this.runD3Code1(data, plotWidth, plotHeight);
        }

    }

    async runD3Code0(dataIn: string, plotWidth: number, plotHeight: number){

        let dimensions = {
            width: plotWidth,
            height: plotHeight,
            radius: -1,
            margin: {
                top:    0, // 10
                right:  0, // 20
                bottom: 0, // 10
                left:   0, // 20
            },
            boundedWidth: -1,
            boundedHeight: -1,
            boundedRadius: -1
        }

        if(plotWidth < plotHeight){
            dimensions.radius = plotWidth/2;
        }else{
            dimensions.radius = plotHeight/2;
        }

        dimensions.boundedWidth  = dimensions.width - dimensions.margin.left - dimensions.margin.right
        dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom
        dimensions.boundedRadius = dimensions.radius - ((dimensions.margin.left + dimensions.margin.right) / 2)

        // format input data
        let data_arr = JSON.parse(dataIn); 

        const nb_bins = data_arr[8];
        const nb_timesteps = data_arr[9+nb_bins+1];

        let data = [...Array.from(Array(nb_bins).keys())].map(b => {      

            let d: any = { binID : b };
            d["startAngle"] =  data_arr[9+b];
            d["endAngle"]   =  data_arr[10+b];
    
            for (let t=0; t<nb_timesteps; t++) { 
                d["t"+t] = data_arr[9+nb_bins+2 + nb_timesteps*b+t];
            }
    
            return d;
        });

        // 1. Define data accessors
        const startAngle_accessor    =  (d: any) => d["startAngle"];
        const endAngle_accessor      =  (d: any) => d["endAngle"];   
        const id_accessor            =  (d: any) => d["binID"];

        // 2. Define scales
        const lerp   = (start: any, end: any, t: any) => { return (1-t)*start + t*end; }

        // compute concentric circle radius based on nb_time_steps
        const radius_max      = dimensions.radius-10;
        const radius_delta    = 1.0 / nb_timesteps;
        const circle_radiuses = [...Array.from(Array(nb_timesteps+1).keys())].map(i => i*radius_delta*radius_max);

        const inner_radiusScale  = (t:any) => circle_radiuses[t];       
        const outter_radiusScale = (t:any) => circle_radiuses[t+1];     
        // const colorScale         = (d:any) => d3.interpolateOranges(d); 
        const colorScale2        = (d:any) => {

            // let COLOR1 = '#FEE6CE';
            let COLOR1 = '#fff5f0';
            // let COLOR2 = '#FDAE6B';
            let COLOR2 = '#f9694c';
            // let COLOR3 = '#E6550D';
            let COLOR3 = '#67000d';
            const remap     = (minval:any, maxval:any, val:any) => { val = Math.max(minval, val); val=Math.min(val, maxval);  return ( val - minval ) / ( maxval - minval ); }
            const lerpColor = (a:any, b:any, amount:any) => {
    
                let ah = parseInt(a.replace(/#/g, ''), 16),
                    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
                    bh = parseInt(b.replace(/#/g, ''), 16),
                    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
                    rr = ar + amount * (br - ar),
                    rg = ag + amount * (bg - ag),
                    rb = ab + amount * (bb - ab);
    
                return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
            }
    
            if (d < 0.5) {
                return lerpColor(COLOR1, COLOR2, remap(0.0, 0.5, d));
            }
            else {
                return lerpColor(COLOR2, COLOR3, remap(0.5, 1.0, d));
            }
        };

        const wrapper = this._svg
                        .attr("width", plotWidth)
                        .attr("height", plotHeight);

        const bounds = wrapper.append("g")
            .attr("id", "bounds")
            .style("transform", `translate(${plotWidth/2}px, 
                ${plotHeight/2}px)`)
            // .style("transform", `translate(${dimensions.margin.left + dimensions.boundedRadius}px, 
            //                                 ${dimensions.margin.top + dimensions.boundedRadius + (plotHeight/2 - dimensions.radius)}px)`)


        // 4. Draw each of the bins
        let bins = bounds.append("g")
            .attr("id", "bins")
            .selectAll("path")
            .data(data)
            .enter();

        bins.each(function(this: any, d: any, b: any){

            let g = d3.select(this);

            for (let t = 0; t < nb_timesteps; t++) {

                let arc = (dataArc: any) => {
                    let arcGen = d3.arc()  
                    .innerRadius(inner_radiusScale(t))      
                    .outerRadius(outter_radiusScale(t))    
                    .startAngle(d => startAngle_accessor(d)) 
                    .endAngle(d => endAngle_accessor(d));

                    return arcGen(dataArc);
                }

                g.append("path")
                    .attr("id", "time-"+t+"-bin-"+(b+1))
                    .attr("class", "bin-"+(b+1))
                    .attr("fill", colorScale2(d["t"+t]))
                    .attr("d", arc);

            }
        });

        // 5. Draw peripherals 

        // draw grid lines
        // const peripherals = bounds.append("g")
        //                             .attr("id", "grid-lines")

        // for (let i = 0; i < 8; i+=2) {
        //     peripherals.append("line")
        //         .attr("class", "grid-line")
        //         .attr("x2", data_arr[i])
        //         .attr("y2", data_arr[i+1])
        // }
                                
        // // draw grid concentric circles
        // const gridCircles = circle_radiuses.map((r, i) => (
        //     peripherals.append("circle")
        //                 .attr("class", "grid-circle-line")
        //                 .attr("r", r)
        // ))

    }

    async runD3Code1(data: any[], plotWidth: number, plotHeight: number){

        // set the dimensions and margins of the graph
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = plotWidth,
            height = plotHeight;
        // width = 460 - margin.left - margin.right,
        // height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = this._svg
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // X axis
        var x = d3.scaleBand()
            .range([ 0, width ])
            .domain(data.map(function(d) { return d.name; }))
            .padding(0.2);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues([]));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0,1])
            .range([ height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));
        
        svg.selectAll(".tick line")
            // .call(yAxis)
            .attr("x2", width + 6)
            .style("opacity", 0.5);

        var colorScale = d3.scaleSequential(d3.interpolateReds);

        // Bars
        svg.selectAll("mybar")
            .data(data)
            .join("rect")
                .attr("x", function(d: any) { return x(d.name); })
                .attr("y", function(d: any) { return y(d.shadowAvg); })
                .attr("width", x.bandwidth())
                .attr("height", function(d: any) { return height - y(d.shadowAvg); })
                .attr("fill", function(d: any){ return colorScale(d.shadowAvg) });

    }

}
