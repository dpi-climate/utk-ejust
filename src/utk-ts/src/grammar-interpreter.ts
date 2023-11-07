/// <reference types="@types/webgl2" />

import { ICameraData, IConditionBlock, IMasterGrammar, IKnotVisibility, IKnot, IMapGrammar, IPlotGrammar, IComponentPosition, IGenericWidget } from './interfaces';
import { PlotArrangementType, OperationType, SpatialRelationType, LevelType, ComponentIdentifier, WidgetType, GrammarType} from './constants';
import { Knot } from './knot';
import { MapViewFactory } from './mapview';
import { Environment } from './environment';
import { DataLoader } from './data-loader';
import { MapRendererContainer } from './reactComponents/MapRenderer';

import React, { ComponentType } from 'react';
import {Root, createRoot} from 'react-dom/client';

import Views from './reactComponents/Views';

// @ts-ignore 
import schema from './json-schema.json'; // master JSON
import schema_categories from './json-schema-categories.json';
import schema_map from './json-schema-maps.json';
import schema_plots from './json-schema-plots.json';

// const Ajv = require("ajv");
import Ajv2019 from "ajv/dist/2019" // https://github.com/ajv-validator/ajv/issues/1462

class GrammarInterpreter {

    protected _grammar: IMasterGrammar;
    protected _components_grammar: {id: string, originalGrammar: (IMapGrammar | IPlotGrammar), grammar: (IMapGrammar | IPlotGrammar | undefined)}[] = [];
    protected _lastValidationTimestep: number;
    protected _components: {type: ComponentIdentifier, obj: any, position: IComponentPosition}[] = [];
    protected _maps_widgets: {type: WidgetType, obj: any, grammarDefinition: IGenericWidget | undefined}[] = [];
    protected _frontEndCallback: any;
    protected _mainDiv: HTMLElement;
    protected _url: string;
    protected _root: Root;
    protected _ajv: any;
    protected _ajv_map: any;
    protected _ajv_plots: any;

    protected _cameraUpdateCallback: any;

    resetGrammarInterpreter(grammar: IMasterGrammar, mainDiv: HTMLElement) {

        this._ajv = new Ajv2019({schemas: [schema, schema_categories]});
        this._ajv_map = new Ajv2019({schemas: [schema_map]});
        this._ajv_plots = new Ajv2019({schemas: [schema_plots]});

        this._url = <string>Environment.backend;

        this._frontEndCallback = null;
        this._mainDiv = mainDiv;
        this.processGrammar(grammar);
    }

    // TODO: it should be possible to create more than one map. So map should not be a singleton
    public initViews(mainDiv: HTMLElement, grammar: IMasterGrammar, originalGrammar: IMasterGrammar, components_grammar: {id: string, originalGrammar: (IMapGrammar | IPlotGrammar), grammar: (IMapGrammar | IPlotGrammar | undefined)}[]){

        const getComponentPosition = (grammar: IMasterGrammar, id: string) => {
            for(const component of grammar.components){
                if(component.id == id){
                    return component.position;
                }
            }
        }

        this._maps_widgets = [];

        for(const component of components_grammar){

            let comp_position = getComponentPosition(grammar, component.id);

            if(component.grammar != undefined && comp_position != undefined){
                if(component.grammar.grammar_type == "MAP"){
                    this._components.push({type: ComponentIdentifier.MAP, obj: MapViewFactory.getInstance(this), position: comp_position});
                    if((<IMapGrammar>component.grammar).widgets != undefined){
                        for(const widget of <IGenericWidget[]>(<IMapGrammar>component.grammar).widgets){
                            if(widget.type == WidgetType.TOGGLE_KNOT){
                                this._maps_widgets.push({type: WidgetType.TOGGLE_KNOT, obj: MapViewFactory.getInstance(this), grammarDefinition: widget});
                            }else if(widget.type == WidgetType.SEARCH){
                                this._maps_widgets.push({type: WidgetType.SEARCH, obj: MapViewFactory.getInstance(this), grammarDefinition: widget});
                            }
                            else if(widget.type == WidgetType.HIDE_GRAMMAR){
                                this._maps_widgets.push({type: WidgetType.HIDE_GRAMMAR, obj: MapViewFactory.getInstance(this), grammarDefinition: widget});
                            }
                        }
                    }
                }else if(component.grammar.grammar_type == "PLOT"){
                    this._components.push({type: ComponentIdentifier.PLOT, obj: {grammar: component.grammar.plot, init: () => {}}, position: comp_position});
                }
            }
        }

        if(grammar.grammar_position != undefined){
            this._components.push({type: ComponentIdentifier.GRAMMAR, obj: this, position: grammar.grammar_position});
        }

        this.renderViews(mainDiv, originalGrammar);
    }

    public validateMasterGrammar(grammar: IMasterGrammar){
        // TODO: checking conflicting types of interactions for the knots. One knot cannot be in plots with different arrangements

        // TODO: ensure that the widgets have all the attributes they should have

        // TODO: check if the knots references in the categories are correct

        // TODO: enforce that if a knot is groupped it can only be referenced by its group name in the categories

        // TODO: one knot cannot be in more than one category at the same time

        // TODO: cannot have two categories with the same name

        const validate = this._ajv.getSchema("https://urbantk.org/grammar")

        const valid = validate(grammar);

        if(!valid){
            for(const error of validate.errors){
                alert("Invalid grammar: "+error.message+"at "+error.dataPath);
            }

            return false;
        }

        this._lastValidationTimestep = Date.now();

        let allKnotsIds: string[] = [];
    
        for(const knot of grammar.knots){
            if(allKnotsIds.includes(knot.id)){
                throw Error("Duplicated knot id");
            }else{
                if(knot.knot_op != true)
                    allKnotsIds.push(knot.id);
            }
        }

        for(const knot of grammar.knots){
            if(knot.knot_op == true){
                for(const integration_scheme of knot.integration_scheme){

                    let operation = integration_scheme.operation;

                    if(operation != OperationType.NONE){
                        throw Error("All operation for knots with knot_op = true should be NONE");
                    }
                }
                
                for(const scheme of knot.integration_scheme){
                    
                    if(scheme.in == undefined){
                        throw Error("in must be defined when knot_op = true");
                    }

                    if(!allKnotsIds.includes(scheme.out.name) || !allKnotsIds.includes(scheme.in.name)){
                        throw Error("When using knot_op out and in must make reference to the id of other knots (that doesnt have knot_op = true)");
                    }

                    if(scheme.op == undefined){
                        throw Error("If knot_op = true each step of the integration_scheme must have a defined op");
                    }

                    if((scheme.maxDistance != undefined || scheme.defaultValue != undefined) && (scheme.spatial_relation != "NEAREST" || scheme.abstract != true)){
                        throw Error("The maxDistance and defaultValue fields can only be used with the NEAREST spatial_relation in abstract links");
                    }

                    if(scheme.maxDistance != undefined && scheme.defaultValue == undefined){
                        throw Error("If maxDistance is used defaultValue must be specified")
                    }

                }

            }

        }
    
        return true;
    }

    public validateComponentGrammar(grammar: IMapGrammar | IPlotGrammar){

        let valid = false;
        let validate = this._ajv_map.getSchema("https://urbantk.org/grammar_maps")

        if(grammar.grammar_type == GrammarType.MAP){
            valid = validate(grammar);
        }else{
            validate = this._ajv_plots.getSchema("https://urbantk.org/grammar_plots")
            valid = validate(grammar);
        }

        if(!valid){
            for(const error of validate.errors){
                alert("Invalid grammar: "+error.message+"at "+error.dataPath);
            }

            return false;
        }

        return true;
    }

    public async processGrammar(grammar: IMasterGrammar){
        if(this.validateMasterGrammar(grammar)){
            // changing grammar to be the processed grammar
            let aux = JSON.stringify(grammar);
            if(grammar.variables != undefined){
                for(let variable of grammar.variables) {
                    aux = aux.replaceAll("$"+variable.name+"$", variable.value);
                }
            }
            let processedGrammar = JSON.parse(aux);
            this._grammar = processedGrammar;

            await this.createSpatialJoins(this._url, processedGrammar);

            Environment.setEnvironment({backend: `http://localhost:5001` as string});
            
            for(const component of grammar.components){
                const url = `${Environment.backend}/files/${component.id}.json`;

                let component_grammar = <IMapGrammar | IPlotGrammar> await DataLoader.getJsonData(url);

                if(this.validateComponentGrammar(component_grammar)){
                    this._components_grammar.push({id: component.id, originalGrammar: component_grammar, grammar: undefined});
                }
            }
            
            for(const component_grammar of this._components_grammar){
                let aux = JSON.stringify(component_grammar.originalGrammar);
                if(component_grammar.originalGrammar.variables != undefined){
                    for(let variable of component_grammar.originalGrammar.variables) {
                        aux = aux.replaceAll("$"+variable.name+"$", variable.value);
                    }
                }
                component_grammar.grammar = JSON.parse(aux);
            }            

            this.initViews(this._mainDiv, processedGrammar, grammar, this._components_grammar); 
        }
    }

    // Called by views
    public init(id: string, updateStatus: any){
        return;
    }

    private createSpatialJoins = async (url: string, grammar: IMasterGrammar) => {
        for(const knot of grammar.knots){
            if(knot.knot_op != true){
                for(let i = 0; i < knot.integration_scheme.length; i++){
                    if(knot.integration_scheme[i].spatial_relation != 'INNERAGG' && knot.integration_scheme[i].in != undefined){
                        let spatial_relation = (<SpatialRelationType>knot.integration_scheme[i].spatial_relation).toLowerCase();
                        let out = knot.integration_scheme[i].out.name;
                        let outLevel = knot.integration_scheme[i].out.level.toLowerCase();
                        let inLevel = (<{name: string, level: LevelType}>knot.integration_scheme[i].in).level.toLowerCase();
                        let maxDistance = knot.integration_scheme[i].maxDistance;
                        let defaultValue = knot.integration_scheme[i].defaultValue;

                        let operation = (<OperationType>knot.integration_scheme[i].operation).toLowerCase();

                        if(operation == 'none'){
                            operation = 'avg'; // there must be an operation to solve conflicts in the join
                        }

                        let inData = (<{name: string, level: LevelType}>knot.integration_scheme[i].in).name;
                        let abstract = knot.integration_scheme[i].abstract;

                        // addNewMessage("Joining "+out+" with "+inData, "red");

                        if(maxDistance != undefined){
                            await fetch(url+"/linkLayers?spatial_relation="+spatial_relation+"&out="+out+"&operation="+operation+"&in="+inData+"&abstract="+abstract+"&outLevel="+outLevel+"&inLevel="+inLevel+"&maxDistance="+maxDistance+"&defaultValue="+defaultValue);
                        }else{
                            await fetch(url+"/linkLayers?spatial_relation="+spatial_relation+"&out="+out+"&operation="+operation+"&in="+inData+"&abstract="+abstract+"&outLevel="+outLevel+"&inLevel="+inLevel).catch(error => {
                                // Handle any errors here
                                console.error(error);
                            });
                        }

                        // addNewMessage("Join finished in " +(elapsed/1000)+" seconds", "green");

                    }
                }
            }
        }
    }

    // private processConditionBlocks(grammar: IMasterGrammar){

    //     let _this = this;

    //     const replaceConditionBlocks = (obj: any) => {
    //         const recursiveSearch = (obj: any) => {
    //             if (!obj || typeof obj !== 'object') {return};
                
    //             Object.keys(obj).forEach(function (k) {
    //                 if(obj && typeof obj === 'object' && obj[k].condition != undefined){ // it is a condition block
    //                     obj[k] = _this.processConditionBlock(obj[k]); // replace the condition block with its evaluation
    //                 }else{
    //                     recursiveSearch(obj[k]);
    //                 }
    //             });
    //         } 
    //         recursiveSearch(obj);
    //     } 
        
    //     replaceConditionBlocks(grammar);

    //     return grammar;
    // }

    // private processConditionBlock(conditionBlock: IConditionBlock){
        
    //     let zoom = this._map.camera.getZoomLevel();
    //     let timeElapsed = Date.now() - this._lastValidationTimestep;

    //     for(let i = 0; i < conditionBlock.condition.length; i++){
    //         let conditionElement = conditionBlock.condition[i];

    //         if(conditionElement.test == undefined) // there is no test to evaluate
    //             return conditionElement.value

    //         let testString = conditionElement.test;

    //         testString = testString.replaceAll("zoom", zoom+'');
    //         testString = testString.replaceAll("timeElapsed", timeElapsed+'');

    //         let testResult = eval(testString);

    //         if(testResult == true){
    //             return conditionElement.value;
    //         }
    //     }

    //     throw Error("Condition block does not have a default value");

    // }
    
    public getCamera(mapId: number = 0): ICameraData{

        let currentMapId = 0;

        for(const component of this._components_grammar){
            if(component.grammar != undefined && component.grammar.grammar_type == GrammarType.MAP){
                if(currentMapId == mapId){
                    return (<IMapGrammar>component.grammar).camera
                }
                
                currentMapId += 1;
            }
        }

        throw new Error("There is no map with that id");
    }

    // If mapId is specified get all the plots that are embedded in that map
    public getPlots(mapId: number | null = null) {
        let plots: any[] = [];
        let map_component: any = null;
        let currentMapId = 0;

        for(const component of this._components_grammar){
            if(component.grammar != undefined && component.grammar.grammar_type == GrammarType.PLOT){
                plots.push(component);
            }

            if(component.grammar != undefined && mapId != null && component.grammar.grammar_type == GrammarType.MAP){
                if(currentMapId == mapId){
                    map_component = component;
                }

                currentMapId += 1;
            }
        }

        if(mapId != null && map_component != null && map_component.grammar.plot != undefined){
            plots = plots.filter((plot) => {console.log(plot); plot.id == map_component.plot.id}); // TODO: give support to more than one embedded plots per map
        }

        return plots;
    }

    public getKnots(){
        return this._grammar.knots;
    }

    public getMap(mapId: number = 0){
        let currentMapId = 0;

        for(const component of this._components_grammar){
            if(component.grammar != undefined && component.grammar.grammar_type == GrammarType.MAP){
                if(currentMapId == mapId){
                    return (<IMapGrammar>component.grammar)
                }
                
                currentMapId += 1;
            }
        }

        throw new Error("There is no map with that id");
    }

    public getFilterKnots(mapId: number = 0){
        return this.getMap(mapId).filterKnots;
    }

    public getProcessedGrammar(){
        return this._grammar;
    }

    public evaluateLayerVisibility(layerId: string, mapId:number): boolean{

        let currentMapId = 0;

        for(const component of this._components_grammar){
            if(component.grammar != undefined && component.grammar.grammar_type == GrammarType.MAP){
                if(currentMapId == mapId){
                
                    if((<IMapGrammar>component.grammar).knotVisibility == undefined)
                        return true;
            
                    let map: any = MapViewFactory.getInstance(this); // TODO: suppor the use of multiple maps
            
                    let zoom = map.camera.getZoomLevel();
                    let timeElapsed = Date.now() - this._lastValidationTimestep;
            
                    let knotId = ''; // TODO: the layer could appear in more than one Knot. Create knot structure
            
                    for(const knot of this._grammar.knots){
                        if(this.getKnotOutputLayer(knot) == layerId){
                            knotId = knot.id;
                            break;
                        }
                    }
            
                    for(const visibility of <IKnotVisibility[]>(<IMapGrammar>component.grammar).knotVisibility){
                        if(visibility.knot == knotId){
                            let testString = visibility.test;
            
                            testString = testString.replaceAll("zoom", zoom+'');
                            testString = testString.replaceAll("timeElapsed", timeElapsed+'');
                        
                            let testResult = eval(testString);
            
                            return testResult;
                        }
                    }
            
                    return true;
                
                
                }
                
                currentMapId += 1;
            }
        }

        throw new Error("There is no map with that id");

    }

    public evaluateKnotVisibility(knot: Knot, mapId:number): boolean{

        let currentMapId = 0;

        for(const component of this._components_grammar){
            if(component.grammar != undefined && component.grammar.grammar_type == GrammarType.MAP){
                if(currentMapId == mapId){

                    if((<IMapGrammar>component.grammar).knotVisibility == undefined)
                        return knot.visible;
        
                    let map: any = MapViewFactory.getInstance(this); // TODO: suppor the use of multiple maps
            
                    let zoom = map.camera.getZoomLevel();
                    let timeElapsed = Date.now() - this._lastValidationTimestep;
            
                    for(const visibility of <IKnotVisibility[]>(<IMapGrammar>component.grammar).knotVisibility){
                        if(visibility.knot == knot.id){
                            let testString = visibility.test;
            
                            testString = testString.replaceAll("zoom", zoom+'');
                            testString = testString.replaceAll("timeElapsed", timeElapsed+'');
                        
                            let testResult = eval(testString);
            
                            return testResult;
                        }
                    }

                }

                currentMapId += 1;
            }
        }

        return knot.visible;
    }

    public getKnotById(knotId: string){

        for(let i = 0; i < this.getKnots().length; i++){
            let knot = this.getKnots()[i];

            if(knotId == knot.id){
                return knot;
            }
        }

    }

    public getKnotOutputLayer(knot: IKnot){
        if(knot.knot_op == true){

            let lastKnotId = knot.integration_scheme[knot.integration_scheme.length-1].out.name;

            let lastKnot = this.getKnotById(lastKnotId);

            if(lastKnot == undefined){
                throw Error("Could not process knot "+lastKnotId);
            }

            return lastKnot.integration_scheme[lastKnot.integration_scheme.length-1].out.name;

        }else{
            return knot.integration_scheme[knot.integration_scheme.length-1].out.name;
        }
    }

    public getKnotLastLink(knot: IKnot){
        if(knot.knot_op == true){
            
            let lastKnotId = knot.integration_scheme[knot.integration_scheme.length-1].out.name;

            let lastKnot = this.getKnotById(lastKnotId);
            
            if(lastKnot == undefined){
                throw Error("Could not process knot "+lastKnotId);
            }

            return lastKnot.integration_scheme[lastKnot.integration_scheme.length-1];

        }else{
            return knot.integration_scheme[knot.integration_scheme.length-1];
        }
    }

    // /**
    //  * The callback is called everytime some data that can impact the front end changes
    //  */
    // private setFrontEndCallback(frontEndCallback: any){
    //     this._frontEndCallback = frontEndCallback;
    // }

    // /**
    //  * The state of the data in the back end changed. Need to propagate change to the front-end
    //  */
    // private stateChanged(){

    //     let states: any[] = [];

    // }

    // TODO: more than one view should be rendered but inside a single div provided by the front end
    private renderViews(mainDiv: HTMLElement, grammar: IMasterGrammar){
        // mainDiv.innerHTML = ""; // empty all content

        if(this._root == undefined){
            this._root = createRoot(mainDiv);
        }else{
            this._root.unmount();
            this._root = createRoot(mainDiv);
        }

        let viewIds: string[] = [];

        for(let i = 0; i < this._components.length; i++){
            viewIds.push(this._components[i].type+i);
        }

        // for(let i = 0; i < this._maps_widgets.length; i++){
        //     viewIds.push(this._maps_widgets[i].type+i);
        // }

        this._root.render(React.createElement(Views, {viewObjs: this._components, mapsWidgets: this._maps_widgets, viewIds: viewIds, grammar: grammar, mainDivSize: {width: mainDiv.offsetWidth, height: mainDiv.offsetHeight}}));
    }

}

export var GrammarInterpreterFactory = (function(){

    var instance: GrammarInterpreter;
  
    return {
      getInstance: function(){
          if (instance == null) {
              instance = new GrammarInterpreter();
          }
          return instance;
      }
    };
  
})();