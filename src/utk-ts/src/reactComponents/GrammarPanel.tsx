import React, { useState, useEffect, useRef } from "react";
// import { createAndRunMap, emptyMainDiv } from "../../../../App";
import JSONEditorReact from "./JSONEditorReact";
import {Col, Row, Button} from 'react-bootstrap';

import {InteractionChannel} from '../interaction-channel';
import {GrammarMethods} from '../grammar-methods';

import { Environment } from "../environment";

import * as d3 from "d3";

import './GrammarPanel.css';

// const params = require('./pythonServerConfig.json');

import { IComponentPosition, IMapGrammar, IMasterGrammar, IPlotGrammar } from "../interfaces";

import schema from '../json-schema.json';
import schema_map from '../json-schema-maps.json';
import schema_plot from '../json-schema-plots.json';

import schema_categories from '../json-schema-categories.json';
import { GrammarPanelVisibility } from "./SideBarMapWigets";
import { GrammarType } from "../constants";

// declaring the types of the props
type GrammarPanelProps = {
    obj: any,
    viewId: string,
    initialGrammar: IMasterGrammar,
    componentsGrammar: { id: string, originalGrammar: IMapGrammar | IPlotGrammar, grammar: IMapGrammar | IPlotGrammar | undefined, position: IComponentPosition | undefined }[],
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}},
    filterKnots: number[],
    inputId: string,
    setCamera: any,
    addNewMessage: any,
    applyGrammarButtonId: string,
    linkMapAndGrammarId: string,
    activeGrammar: string,
    activeGrammarType: GrammarType
}

export const GrammarPanelContainer = ({
    obj,
    viewId,
    initialGrammar,
    componentsGrammar,
    camera,
    filterKnots,
    inputId,
    setCamera,
    addNewMessage,
    applyGrammarButtonId,
    linkMapAndGrammarId, 
    activeGrammar,
    activeGrammarType
}: GrammarPanelProps
) =>{

    const [mode, setMode] = useState('code');

    const [activeSchema, setActiveSchema] = useState<any>(schema);

    const [grammar, _setCode] = useState('');

    const grammarStateRef = useRef(grammar);
    const setCode = (data: string) => {
        grammarStateRef.current = data;
        _setCode(data);
    };

    const [tempGrammar, _setTempGrammar] = useState('');

    const tempGrammarStateRef = useRef(tempGrammar);
    const setTempGrammar = (data: any) => {
        tempGrammarStateRef.current = data;
        _setTempGrammar(data);
    };

    const [refresh, setRefresh] = useState(false);

    // const url = process.env.REACT_APP_BACKEND_SERVICE_URL;
    const url = `${Environment.backend}`

    const modifyGrammarAndApply = () => {
        // GrammarPanelVisibility = !(GrammarPanelVisibility);
        applyGrammar(true);
    }
    InteractionChannel.setModifyGrammarVisibility(modifyGrammarAndApply);

    const applyGrammar = async (visibilityToggle = false, grammar: string | undefined = undefined) => {

        if(tempGrammarStateRef.current != ''){
            try{                
                JSON.parse(tempGrammarStateRef.current); // testing if temp grammar contains a valid grammar
            }catch(err){
                console.error('Grammar is not valid');
                return;
            }
        }

        let sendGrammar = '';

        let currentGrammar = grammarStateRef.current;
        if(grammar != undefined) {
            currentGrammar = grammar;
        }

        if(activeGrammarType == GrammarType.MAP && !d3.select('#'+linkMapAndGrammarId).empty() && d3.select('#'+linkMapAndGrammarId).property("checked")){
            if(tempGrammarStateRef.current == ''){
                sendGrammar = addCameraAndFilter(currentGrammar, camera, filterKnots);
            }else{
                sendGrammar = addCameraAndFilter(tempGrammarStateRef.current, camera, filterKnots);
            }
        }else{
            if(tempGrammarStateRef.current == ''){
                sendGrammar = currentGrammar;
            }else{
                sendGrammar = tempGrammarStateRef.current;
            }
        }

        if(visibilityToggle){
            sendGrammar = checkGrammarVisibility(sendGrammar);
        }

        // updateTimeBtn(sendGrammar);

        setCode(sendGrammar);
        setTempGrammar('');

        const data = sendGrammar;

        if(activeGrammarType == GrammarType.MASTER){
            GrammarMethods.applyGrammar(url, JSON.parse(data), "GrammarPanel", (response: Object) => {
                obj.processGrammar(JSON.parse(grammarStateRef.current));
            }, "grammar");
        }else{
            for(const component_grammar of componentsGrammar){
                if(component_grammar.id == activeGrammar){
                    GrammarMethods.applyGrammar(url, JSON.parse(data), "GrammarPanel", (response: Object) => {
                        obj.updateComponentGrammar(JSON.parse(grammarStateRef.current), component_grammar);
                        obj.replaceVariablesAndInitViews();
                    }, component_grammar.id);
                }
            }
        }

    }

    const addCameraAndFilter = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}, filterKnots: number[]) => {
        if(grammar == ''){
            return '';
        }

        if(camera.position.length == 0 && filterKnots.length == 0){
            return grammar;
        }

        let parsedGrammar = JSON.parse(grammar);

        for(const component of parsedGrammar.components){ // Grammar camera is the same for all map views
            if("map" in component){
                if(camera.position.length != 0)
                    component.map.camera = camera;
        
                if(filterKnots.length != 0)
                    component.map.filterKnots = filterKnots;
                else if(component.map.filterKnots != undefined)
                    delete component.map.filterKnots
            }
        }

        return JSON.stringify(parsedGrammar, null, 4);
    }

    const checkGrammarVisibility = (grammar: string) => {
        var parsedGrammar = JSON.parse(grammar);
        
        if(GrammarPanelVisibility){
            parsedGrammar.grammar_position.width = [1, 5];
        }
        else{
            parsedGrammar.grammar_position.width = [0, 0];
        }
        return JSON.stringify(parsedGrammar, null, 4);
    }

    // const updateTimeBtn = (grammar:string) => {
    //     var parsedGrammar = JSON.parse(grammar);
    //     let currentTime = parseInt(parsedGrammar.variables[0].value);
        
    //     let updateTimeFunction = InteractionChannel.getPassedVariable("timestamp");
    //     if(currentTime>0 && currentTime<11){
    //         updateTimeFunction(currentTime);
    //     }
    // }

    const updateLocalNominatim = (camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } }, filterKnots: number[]) => {
        setTempGrammar(addCameraAndFilter(grammarStateRef.current, camera, filterKnots)); // overwrite previous changes with grammar integrated with camera and filter knots
    }
    
    const updateCameraNominatim = (place: string) => {
        fetch(url+"/solveNominatim?text="+place, {
            method: 'GET'
        })
        .then(async (response) => {

            let responseJson = await response.json();

            updateLocalNominatim(responseJson, filterKnots);
            setCamera(responseJson);

            d3.select('#'+linkMapAndGrammarId).property("checked", true);
        })
        .catch(error => {
            console.error('Error trying to resolve nominatim: ', error);
        });
    }

    // useEffect(() => {
    //     console.log("i am being called");
    //     if(grammarStateRef.current != "") {
    //         console.log("my own label", grammarStateRef.current)
    //         obj.processGrammar(JSON.parse(grammarStateRef.current));
    //         applyGrammar();
    //     }
    // }, [grammarStateRef.current]);

    // run only once to load the initial data
    useEffect(() => {
        GrammarMethods.subscribe("GrammarPanel", (new_grammar: Object) => { 
            setCode(JSON.stringify(new_grammar));
            obj.processGrammar(JSON.parse(grammarStateRef.current));
            applyGrammar(false, JSON.stringify(new_grammar));
        });

        let stringData = JSON.stringify(initialGrammar, null, 4);
        setCode(stringData);

        d3.select('#'+inputId).on("keydown", function(e: any) {
            if(e.key == 'Enter'){

                d3.select('#'+linkMapAndGrammarId).property("checked", false);

                let inputValue = d3.select('#'+inputId).attr("value");
                
                if(inputValue != undefined && !Array.isArray(inputValue)){
                    updateCameraNominatim(inputValue.toString());
                }else{
                    throw Error("Invalid place");
                }
    
            }
        });

        d3.select('#'+applyGrammarButtonId).on("click", function(e: any) {
            applyGrammar();
        });

        d3.select('#'+linkMapAndGrammarId).on('change', function(e: any){
            setRefresh(!refresh);
        });

    }, []);

    useEffect(() => {
        if(activeGrammar == "grammar"){
            let stringData = JSON.stringify(initialGrammar, null, 4);
            setCode(stringData);
            setActiveSchema(schema);
        }else{
            for(const component of componentsGrammar){
                if(component.id == activeGrammar && component.grammar != undefined){
                    let stringData = JSON.stringify(component.grammar, null, 4);
                    setCode(stringData);
                    if(component.grammar.grammar_type == GrammarType.MAP){
                        setActiveSchema(schema_map);
                    }else if(component.grammar.grammar_type == GrammarType.PLOT){
                        setActiveSchema(schema_plot);
                    }
                }
            }
        }
        
        setTempGrammar('');
    }, [activeGrammar]);

    const checkIfAddCameraAndFilter = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}, tempGrammar: string, filterKnots: number[]) => {
 
        let inputLink = d3.select('#'+linkMapAndGrammarId)
        
        let returnedGrammar: any = {};

        if(inputLink.empty()){
            if(tempGrammar != ''){
                returnedGrammar.text = tempGrammar;
            }else if(grammar != ''){
                returnedGrammar.json = JSON.parse(grammar);
            }else{
                returnedGrammar.json = {};
            }
            return returnedGrammar;
        }

        let mapAndGrammarLinked = inputLink.property("checked");

        if(mapAndGrammarLinked){
            let mergedGrammar = addCameraAndFilter(grammar, camera, filterKnots);

            if(mergedGrammar != ''){
                returnedGrammar.json = JSON.parse(mergedGrammar);
            }else{
                returnedGrammar.json = {};
            }

            return returnedGrammar
        }else{
            if(tempGrammar != ''){
                returnedGrammar.text = tempGrammar;
            }else if(grammar != ''){
                returnedGrammar.json = JSON.parse(grammar);
            }else{
                returnedGrammar.json = {};
            }

            return returnedGrammar;
        }
    }

    const updateGrammarContent = (grammarObj: any) => {
        setTempGrammar(grammarObj);
    }

    const onModeChange = (mode: string) => {
        setMode(mode);
    };    

    const modes = ['code'];

    return(
        <React.Fragment>
            <div className="my-editor" style={{overflow: "auto", fontSize: "24px", height: "max(90%,calc(100% - 40px))"}}>
                <JSONEditorReact
                    content={checkIfAddCameraAndFilter(grammar, camera, tempGrammar, filterKnots)}
                    schema={activeSchema}
                    schemaRefs={{"categories": schema_categories}}
                    mode={'code'}
                    modes={modes}
                    onChangeText={updateGrammarContent}
                    onModeChange={onModeChange}
                    allowSchemaSuggestions={true}
                    indentation={2}
                />
            </div>
            <div className="d-flex align-items-center justify-content-center" style={{overflow: "auto", height: "min(10%, 40px)"}}>
                <Button variant="secondary" id={applyGrammarButtonId} style={{marginRight: "10px"}}>Apply Grammar</Button>
                <input name="linkMapAndGrammar" type="checkbox" id={linkMapAndGrammarId} style={{marginRight: "5px"}}></input>
                <label htmlFor="linkMapAndGrammar">Link</label>
            </div>
        </React.Fragment>
    )
}