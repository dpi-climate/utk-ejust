import React, { useState, useEffect } from "react";
import { GrammarType, WidgetType } from "../constants";
import { IConditionBlock, IGenericWidget, IToggleKnotItem } from "../interfaces";
import { ToggleKnotsWidget } from './toggle-knot-widget/ToggleKnotsWidget';
import { SearchWidget } from './SearchWidget';
import {Row, Col} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup, faChartSimple, faEyeSlash, faSearch, faEye, faCode } from '@fortawesome/free-solid-svg-icons'
import * as d3 from "d3";
import { InteractionChannel } from "../interaction-channel";
import { ColorScaleContainer } from './ColorScale';
import { TimeSlider } from "./TimeSlider";

type SideBarMapWidgetsProps = {
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number,
    listLayers: { [key: string]:  IToggleKnotItem[]; },
    knotVisibility: { [key: string]:  boolean; },
    inputBarId: string,
    genericPlots: any,
    togglePlots: any,
    mapWidgets: {type: WidgetType, obj: any, grammarDefinition: IGenericWidget | undefined}[] // each viewObj has a an object representing its logic
    componentId: string,
    editGrammar: any,
    broadcastMessage: any
}

export var GrammarPanelVisibility = true;
export const SideBarMapWidgets = ({x, y, mapWidth, mapHeight, listLayers, knotVisibility, inputBarId, genericPlots, togglePlots, mapWidgets, componentId, editGrammar, broadcastMessage}:SideBarMapWidgetsProps) =>{

    const handleToggleKnotClick = (e: any) => {

      if(d3.select("#toggle_knot_widget").style("display") == "block"){
          d3.select("#toggle_knot_widget").style("display", "none");
      }else{
        d3.select("#toggle_knot_widget").style("display", "block");
      }
    }

    const handleClickSearch = (e: any) => {

      if(d3.select("#search_widget").style("display") == "block"){
          d3.select("#search_widget").style("display", "none");
      }else{
        d3.select("#search_widget").style("display", "block");
      }
    }

    const handleClickHideGrammar = (e: any) => {
      GrammarPanelVisibility = !(GrammarPanelVisibility);
      InteractionChannel.getModifyGrammarVisibility()();
    }

    // const handleTogglePlots = (e: any) => {
    //   togglePlots();
    // }

    const [colorScales, setColorScales] = useState<{range: number[], domain: number[], cmap: string | IConditionBlock, id: string, scale: string, visible: boolean}[]>([]);

    useEffect(() => {

      const colorScalesAux: {range: number[], domain: number[], cmap: string | IConditionBlock, id: string, scale: string, visible: boolean}[] = [];

      for (const groupName of Object.keys(listLayers)) {
        for (const item of listLayers[groupName]) {
          colorScalesAux.push({range: item.range, domain: item.domain, cmap: item.cmap, id: item.id, scale: item.scale, visible: false});
        }
      }
  
      setColorScales(colorScalesAux);

    }, [listLayers]);

    const toggleColorScaleVisibility = (id: string) => {
      let colorScalesAux: any = [];
      
      for(const colorScale of colorScales){

        colorScalesAux.push({...colorScale});

        if(colorScale.id == id){
          colorScalesAux[colorScalesAux.length-1].visible = !colorScalesAux[colorScalesAux.length-1].visible;
        }
      }

      setColorScales(colorScalesAux);
    }

    const renderColorScale = () => {
      return (
        colorScales.map((colorScaleInfo: {range: number[], domain: number[], cmap: string | IConditionBlock, id: string, scale: string, visible: boolean}) => (
          <ColorScaleContainer 
              id={colorScaleInfo.id}
              x={20}
              y={-250}
              range={colorScaleInfo.range}
              domain={colorScaleInfo.domain}
              cmap={colorScaleInfo.cmap}
              scale={colorScaleInfo.scale}
              disp={colorScaleInfo.visible}
          />
      ))
      )
    }

    const renderGrammarWidget = () => {
      return (
        <div style={{ backgroundColor: "white", width: "75px", position: "absolute", right: "10px", bottom: "10px", padding: "5px", borderRadius: "8px", border: "1px solid #dadce0", opacity: 0.9, boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)" }}>
          <Row>
              <FontAwesomeIcon size="2x" style={{ color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px" }} icon={faCode} onClick={() => editGrammar(componentId, GrammarType.MAP)} />
          </Row>
        </div>
      )
    }
    
    const renderIconsClicks = () => {
      return mapWidgets.map((widget, index) => {
        if(widget.type == WidgetType.TOGGLE_KNOT){
          return (
            <React.Fragment key={"toggle_knot_"+index}>
            <div className='component' id="toggle_knot_widget" style={{position: "absolute", right: 100, top: 10, width: 250, borderRadius: "8px", border: "1px solid #dadce0", opacity: 0.9, boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)", display: "none"}}>
              <ToggleKnotsWidget
                obj = {widget.obj}
                listLayers = {listLayers}
                knotVisibility = {knotVisibility}
                widgetIdx = {index}
                grammarDefinition = {widget.grammarDefinition}
                broadcastMessage = {broadcastMessage}
                toggleColorScaleVisibility = {toggleColorScaleVisibility}
              />
            </div>
          </React.Fragment>
          )

        } else if(widget.type == WidgetType.SEARCH){
          return (
            <React.Fragment key={"search_"+index}>
            <div id="search_widget" style={{borderRadius: "8px", position: "absolute", left: mapWidth - 240, top: 10, opacity: 0.9, display: "none"}}>
              <SearchWidget 
                obj = {widget.obj}
                viewId = {"search_"+index}
                inputId = {inputBarId}
              />
            </div>
          </React.Fragment>
          )
        }
      })

    }

    const renderIcons = () => {
      return mapWidgets.map((component, index) => {
        if(component.type == WidgetType.TOGGLE_KNOT){
          return <FontAwesomeIcon key={"widget_"+index} size="2x" style={{color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px"}} icon={faLayerGroup} onClick={handleToggleKnotClick} />
        
        } else if(component.type == WidgetType.SEARCH){
          return <FontAwesomeIcon key={"widget_"+index} size="2x" style={{color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px"}} icon={faSearch} onClick={handleClickSearch} />
        
        } else if(component.type == WidgetType.HIDE_GRAMMAR){
          return GrammarPanelVisibility
            ? <FontAwesomeIcon key={"widget_"+index} size="2x" style={{color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px"}} icon={faEye} onClick={handleClickHideGrammar} />
            : <FontAwesomeIcon key={"widget_"+index} size="2x" style={{color: "#696969", padding: 0, marginTop: "5px", marginBottom: "5px"}} icon={faEyeSlash} onClick={handleClickHideGrammar} />
        }
      })
    }

    const renderSlider = () => {
      
      return (
        <div style={{ backgroundColor: "white", width: "750px", position: "absolute", left: "10px", bottom: "10px", padding: "5px", borderRadius: "8px", border: "1px solid #dadce0", opacity: 0.9, boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)" }}>
          {/* <div style={{overflowY: "auto", overflowX: "clip", height: "73%", padding: "10px"}} id="time_slider"> */}
          <div style={{height: "73%", paddingRight: "20px", paddingLeft: "20px", paddingTop: "10px"}} id="time_slider">
          {/* <Row> */}
              <TimeSlider/>
          {/* </Row> */}
          </div>
        </div>
      )
    }
    
    const render = () => {
      return (
        <React.Fragment>
          {renderColorScale()}
          <div style={{backgroundColor: "white", width: "75px", position: "absolute", right: "10px", top: "10px", padding: "5px", borderRadius: "8px", border: "1px solid #dadce0", opacity: 0.9, boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)"}}>
            <Row>
              {renderIcons()}
            </Row>
            {renderIconsClicks()}
          </div>
          {renderGrammarWidget()}
          {renderSlider()}
        </React.Fragment>
      )
    }
        
    return mapWidgets.length == 0 ? null : render()

}