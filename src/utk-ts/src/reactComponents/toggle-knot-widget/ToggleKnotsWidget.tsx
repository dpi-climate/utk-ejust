import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import Slider from '@mui/material/Slider';
import {Row, Col} from 'react-bootstrap';
import { ICategory, IToggleKnotItem } from "../../interfaces";
import * as d3 from "d3";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown } from '@fortawesome/free-solid-svg-icons'
import './ToggleKnotsWidget.css'

// declaring the types of the props
type ToggleKnotsWidgetProps = {
    obj: any // map 
    listLayers: any
    knotVisibility: { [key: string]:  boolean; }
    widgetIdx: number
    grammarDefinition: any
    broadcastMessage: any
    toggleColorScaleVisibility: any
    setShowSlider: Function
    setNTimesteps: Function
    setTimestep: Function
    activeTimestep: number
}

export const ToggleKnotsWidget = ({obj, listLayers, knotVisibility, widgetIdx, grammarDefinition, broadcastMessage, toggleColorScaleVisibility, setShowSlider, setNTimesteps, activeTimestep, setTimestep}:ToggleKnotsWidgetProps) =>{
   
  // Animation ====================================================

  const [initialTime, setInitialTime] = useState<number>(Date.now());

  const [maxTimestep, setMaxTimestep] = useState<number>(0);
  const [minTimestep, setMinTimestep] = useState<number>(0);

  const [sliderValue, setSliderValue] = useState<number[]>([0,1]);

  const [fps, _setFps] = useState<number>(5);

  const fpsRef = useRef(fps);
  const setFps = (data: any) => {
      fpsRef.current = data;
      _setFps(data);
  };

  // current ranges
  const [range, _setRange] = useState<any>({});

  const rangeRef = useRef(range);
  const setRange = (data: any) => {
      rangeRef.current = data;
      _setRange(data);
  };

  // persisting listLayers to get inside interval
  const [listLayersState, _setListLayersState] = useState<any>({});

  const listLayersStateRef = useRef(listLayersState);
  const setListLayersState = (data: any) => {
      listLayersStateRef.current = data;
      _setListLayersState(data);
  };

  // const [colorScales, setColorScales] = useState<{range: number[], domain: number[], cmap: string, id: string, scale: string}[]>([]);
  
  useEffect(() => {

      const intervalId = window.setInterval(function(){

          let div = document.getElementById("toggle_widget_"+widgetIdx);

          if(div == null || Object.keys(listLayersStateRef.current).length == 0)
              return;

          let children = div.childNodes;

          let groupsToAnimate = [];

          for (let i = 0; i < children.length; i++) {
              const child = children[i] as HTMLElement;
          
              let inputs = child.querySelectorAll("div input");

              for(let j = 0; j < inputs.length; j++){
                  let input = inputs[j] as HTMLInputElement;
                  if(input.checked && listLayersStateRef.current[input.id] != undefined && listLayersStateRef.current[input.id].length > 1){
                      groupsToAnimate.push(input.id);
                  }
              }   
          }

          // for(const group of groupsToAnimate){

          //     let knotsToConsider = [];
          //     let range = 0 ? rangeRef.current[group] == undefined : rangeRef.current[group];

          //     knotsToConsider = listLayersStateRef.current[group].slice(0,range+1);

          //     if(knotsToConsider.length == 0) // should not do any animation
          //         return
  
          //     let elapsedTime = Date.now() - initialTime;
  
          //     let changeEvery = 1000/fpsRef.current;
  
          //     let indexLayer = Math.round((elapsedTime%(changeEvery*(knotsToConsider.length)))/changeEvery);

          //     if(indexLayer > knotsToConsider.length-1){
          //         indexLayer = 0;
          //     }

          //     let layerToShow = knotsToConsider[indexLayer];
  
          //     for(let i = 0; i < listLayersStateRef.current[group].length; i++){
          //         let key = listLayersStateRef.current[group][i];
  
          //         if(key == layerToShow){
          //             obj.toggleKnot(layerToShow, true);
          //         }else{
          //             obj.toggleKnot(key, false);
          //         }
          //     }
          // }
              
      }, 50);

      return () => {
          window.clearInterval(intervalId);
      };

  }, [listLayersState]);

  useEffect(() => {

      setListLayersState(listLayers);

  }, [listLayers]);

  // =================================================

  const groupVisibility = (groupedList:any, visibilityList: any, id: string) => {
    for(const layer of groupedList[id]){
        if(visibilityList[layer.id]){
            return true;
        }
    }

    return false
  }

  const handleOnChangeItem = (itemObj: IToggleKnotItem) => {
    // Make nonoverlap knots invisible
    const nextKnotVisibility = { ...knotVisibility }

    if (itemObj.nonoverlap !== null && !knotVisibility[itemObj.id]) {
      itemObj.nonoverlap.forEach((knotId: string) => {
        obj.toggleKnot(knotId, false)
        nextKnotVisibility[knotId] = false
      })      
    }

    nextKnotVisibility[itemObj.id] = !nextKnotVisibility[itemObj.id]

    // Update slider's maximum value and if it will be rendered
    const visibleKnotsKeys = Object.keys(nextKnotVisibility).filter((k:string) => nextKnotVisibility[k])
    const visibleKnotsNewTimestep: number[] = []
    let _nTimesteps: number = 0
    let _showSlider = false
 
    for(const groupName of Object.keys(listLayers)) {
      for(const item of listLayers[groupName]) {
        if(visibleKnotsKeys.includes(item.id)) {
          if(_showSlider === false && item.nTimesteps !== undefined) {
            _showSlider = true
          }

          let timestepIdx = activeTimestep < item.nTimesteps
            ? activeTimestep
            : 0
          
          if(item.timestep_array !== null) {
            timestepIdx = item.timestep_array.indexOf(activeTimestep) > -1
              ? item.timestep_array.indexOf(activeTimestep)
              : 0
          }
          broadcastMessage("", "updateTimestepKnot", {knotId: item.id, timestep: timestepIdx, mapId: obj.viewId})
        }
      }
    }

    // // Update knots' time step
    // for(const groupName of Object.keys(listLayers)){
    //   for(const item of listLayers[groupName]) {
    //     if(nextKnotVisibility[item.id] && item.nTimesteps > 1 && activeTimestep <= item.nTimesteps - 1) {
    //       broadcastMessage("", "updateTimestepKnot", {knotId: item.id, timestep: activeTimestep, mapId: obj.viewId})
    //     }
    //   }
    // }    

    obj.toggleKnot(itemObj.id, !knotVisibility[itemObj.id])
    // if (newTimestep !== activeTimestep) setTimestep(newTimestep)
    setTimestep(activeTimestep)
    setNTimesteps(_nTimesteps)
    setShowSlider(_showSlider)
  }

  const handleCheckedItem = (id: string) => knotVisibility[id]

  // if activated uncheck all elements of the group. If not activated activate the first element
  const toggleGroup = (groupedList:any, visibilityList: any, id: string, value: boolean | null = null) => {
    if(value == null){
      let activated = false;

      for(const layer of groupedList[id]){ // deactivate all activated sub knots
          
          if(visibilityList[layer.id]){
              obj.toggleKnot(layer.id, false);
              activated = true;
          }
      }
      
      
      if(!activated){ // activate the first sub knot if no sub knot was activated
          obj.toggleKnot(groupedList[id][0].id, true);
      }
      
    }else{
        for(let i = 0; i < groupedList[id].length; i++){
            let layer = groupedList[id][i]
            if(value){
                if(i == 0)
                    obj.toggleKnot(layer.id, true);
                else
                    obj.toggleKnot(layer.id, false);
            }else{
                obj.toggleKnot(layer.id, false);
            }
        }
    }
  }

  useEffect(() => {

      // let minMaxTimesteps = getMinMaxTimesteps(listLayers);

      // setMinTimestep(minMaxTimesteps[0]);
      // setMaxTimestep(minMaxTimesteps[1]);

      // setSliderValue([0,Math.round((1/(minTimestep+1))*100)]);

  }, [listLayers]);

  const getMarks = (layers: any) => {
      let marks = [];
      
      for(let i = 0; i < layers.length; i++){

          let mark = {
              value: Math.round((i/layers.length)*100),
              label: ''+i
          };

          marks.push(mark);
      }

      return marks;
  }

  const getMarksTimesteps = (layer: any, totalSteps: number) => {
      let marks = [];
      
      for(let i = 0; i < layer.nTimesteps; i++){
          let mark = {
              value: Math.round((i/totalSteps)*100),
              label: ''+i
          };

          marks.push(mark);
      }

      return marks;
  }

  const handleChangeSlides = (e: any, group: string, step: number) => {

      let newObj: any = {};

      let exists = false;

      for(const key of Object.keys(rangeRef.current)){
          if(key != group){
              newObj[key] = rangeRef.current[key];
          }else{
              exists = true;
              newObj[key] = Math.round(e.target.value/step);
          }
      }

      if(!exists){
          newObj[group] = Math.round(e.target.value/step);
      }
      
      setRange(newObj);
  }

  const handleChangeSlidesTimesteps = (sliderValue: number[], layer: any, step: number) => {

      // even though it is a range of values the timestep shown is always the first
      let currentTimestep = Math.round(sliderValue[0]/step);

      if(currentTimestep <= layer.nTimesteps-1){ // TODO: add lower boundary
          broadcastMessage("", "updateTimestepKnot", {knotId: layer.id, timestep: currentTimestep, mapId: obj.viewId});
      }
  }

  useEffect(() => {
    for(const groupName of Object.keys(listLayers)){
      for(const item of listLayers[groupName]) {
        if(knotVisibility[item.id]) {
          let timestepIdx = activeTimestep < item.nTimesteps
            ? activeTimestep
            : 0
          
          if(item.timestep_array !== null) {
            timestepIdx = item.timestep_array.indexOf(activeTimestep) > -1
              ? item.timestep_array.indexOf(activeTimestep)
              : 0
            
          }

          broadcastMessage("", "updateTimestepKnot", {knotId: item.id, timestep: timestepIdx, mapId: obj.viewId})
        }

        // if(knotVisibility[item.id] && item.nTimesteps > 1 && activeTimestep <= item.nTimesteps - 1) {
          // broadcastMessage("", "updateTimestepKnot", {knotId: item.id, timestep: activeTimestep, mapId: obj.viewId})
        // }
      }
    }
  }, [activeTimestep]);

  const [collapsedItems, setCollapsedItems] = useState<string[]>([]);

  const toggleCollapse = (item: string) => {
      if (collapsedItems.includes(item)) {
        setCollapsedItems(collapsedItems.filter((id) => id !== item));
      } else {
        setCollapsedItems([...collapsedItems, item]);
      }
  };

  const getCategoryHtml = (category: ICategory, listLayers: any, knotVisibility: any) => {
      if(Object.keys(listLayers).length == 0 || knotVisibility.length == 0)
          return

      
      return<li key={category.category_name+"_li"}>
          <div key={category.category_name+"_span"} style={{margin: "5px", fontWeight: "bold", cursor: "pointer", color: collapsedItems.includes(category.category_name) ? 'black' : '#009687' }} onClick={() => toggleCollapse(category.category_name)}>
              {category.category_name}
          </div>
          <ul key={category.category_name+"_ul"} style={{listStyleType: "none", display: collapsedItems.includes(category.category_name) ? 'none' : 'block' }}>
              {
                  category.elements.map((element: string | ICategory, index: any) => (
                      typeof element === 'string' ? <li key={element+"_li"+"_"+index}>{getGroupHtml(element, listLayers, knotVisibility)}</li> : getCategoryHtml(element, listLayers, knotVisibility)
                  ))
              }
          </ul>
      </li>
  }

  const getNotInCategoriesHtml = (args: any, listLayers: any, knotVisibility: any) => {

      let categories: ICategory[] | undefined;

      if(args != undefined)
          categories = args.categories;

      if(Object.keys(listLayers).length == 0 || knotVisibility.length == 0)
          return

      let categorizedKnots: any[] = [];

      const getKnotsFromCategory = (category: ICategory) => {
          let knots: any = [];

          for(const element of category.elements){
              if(typeof element === 'string'){
                  knots.push(element);
              }else{
                  knots = knots.concat(getKnotsFromCategory(element));
              }
          }

          return knots;
      }

      if(categories != undefined){
          for(const category of categories){
              categorizedKnots = categorizedKnots.concat(getKnotsFromCategory(category));
          }
      }


      return Object.keys(listLayers).map((item: any, index: any) => (
              !categorizedKnots.includes(item) ? <li key={item+"_li_"+"_non_cat"}>{getGroupHtml(item, listLayers, knotVisibility)}</li> : <span key={item+"_empty"}></span>
          ))
  }

  const getMinMaxTimesteps = (listLayers: any) => {

      let maxTimesteps = 0;

      for(const item of Object.keys(listLayers)){
          if(listLayers[item].length == 1){
              if(listLayers[item][0].nTimesteps >= maxTimesteps){
                  maxTimesteps = listLayers[item][0].nTimesteps;
              }
          }
      }

      // let minTimesteps = maxTimesteps;

      // for(const item of Object.keys(listLayers)){
      //     if(listLayers[item].length == 1){
      //         if(listLayers[item][0].nTimesteps <= minTimesteps){
      //             minTimesteps = listLayers[item][0].nTimesteps;
      //         }
      //     }
      // }

      return [0, maxTimesteps];
  }

  const getSlideSteps = (listLayers: any) => {
      let minMaxTimesteps = getMinMaxTimesteps(listLayers);

      return Math.round((1/(minMaxTimesteps[1] - minMaxTimesteps[0]))*100);
  }

  const getGroupHtml = (item:string, listLayers: any, knotVisibility: any) => {

      return <React.Fragment key={item+"_fragment"}>
          <Row style={{paddingTop: "5px", paddingBottom: "5px"}} className="align-items-center">
              <Col md={3}>
                  <Row>
                      <Col md={9}>
                          <Form.Check key={item+"_check"} checked={groupVisibility(listLayers, knotVisibility, item)} type="checkbox" label={item} id={item} onChange={() => {toggleGroup(listLayers, knotVisibility, item)}}/> 
                      </Col>
                      <Col md={3}>
                          <Form.Check key={item+"_check_color"} type="checkbox" onChange={(event) => {toggleColorScaleVisibility(item)}}/> 
                      </Col>
                  </Row>
              </Col>
              {
                  listLayers[item].length > 1 ?
                  <Col>
                      <Row style={{padding: 0}} className="align-items-center">
                          <Col md={12}>
                              <Slider
                                  key={item+"_slider"}
                                  defaultValue={0}
                                  valueLabelDisplay="off"
                                  step={Math.round((1/listLayers[item].length)*100)}
                                  marks = {getMarks(listLayers[item])}
                                  onChange={(e) => {handleChangeSlides(e, item, Math.round((1/listLayers[item].length)*100))}}
                                  disabled = {!groupVisibility(listLayers, knotVisibility, item)}
                              />
                          </Col>
                          {/* <Col md={3} style={{paddingLeft: 0}}>
                              <Form.Control placeholder="FPS" type="text" onChange={(e) => {if(e.target.value != ''){setFps(parseInt(e.target.value))}}}/>
                          </Col> */}
                  </Row></Col> : listLayers[item][0].nTimesteps != undefined && listLayers[item][0].nTimesteps > 1 ?
                      <Col>
                      <Row style={{padding: 0}} className="align-items-center">
                          <Col md={12}>
                              <Slider
                                  key={item+"_slider_timestep"}
                                  // defaultValue={[0,0+Math.round((1/maxTimestep)*100)]}
                                  value={sliderValue}
                                  valueLabelDisplay="off"
                                  step={Math.round((1/(maxTimestep - minTimestep))*100)}
                                  min={0}
                                  max={Math.round((1/maxTimestep)*100)*(maxTimestep-1)}
                                  marks = {getMarksTimesteps(listLayers[item][0], maxTimestep - minTimestep)}
                                  onChange={(e: any) => {
                                      if(e != null && e.target != null){
                                          setSliderValue(e.target.value);
                                      }
                                  }}
                                  disabled = {!groupVisibility(listLayers, knotVisibility, item)}
                              />
                          </Col>
                  </Row></Col>: <></>
              }
          </Row>
      </React.Fragment>
  }

  const showHideSubitems = (itemId:string) => {

    if(d3.select(`#${itemId}`).style("display") == "inline-block"){
        d3.select(`#${itemId}`).style("display", "none");
    }else{
      d3.select(`#${itemId}`).style("display", "inline-block");
    }
  }

  const renderItems = () => {
    return Object.keys(listLayers).map((groupName: string) => {
      const groupId = `toggle-group-${groupName}`

      if(groupName === "Single") {
        return listLayers[groupName].map((item: IToggleKnotItem) => renderItem(item))

      } else {
        return (
          <li>
            <div className="button toggle-group" onClick={() => showHideSubitems(groupId)}>
              {groupName}
              <FontAwesomeIcon icon={faCaretDown} style={{color: "#696969", marginLeft:"5px"}}/>
              </div>
            <ul id={groupId} style={{display: "none"}}>
              {listLayers[groupName].map((item: IToggleKnotItem) => renderItem(item))}
            </ul>
          </li>
        )
      }
    })

    function renderItem(itemObj: IToggleKnotItem) {
      return(
        <div className={`toggle-item`} id={`toogle-item-${itemObj.id}`}>
          <Form.Check 
            key={itemObj.id+"_check"} 
            checked={handleCheckedItem(itemObj.id)} 
            type="checkbox" 
            label={itemObj.id} 
            id={itemObj.id} 
            onChange={() => {handleOnChangeItem(itemObj)}}
          />
        </div>
      )
    }
  }

  return (
    <div style={{overflowY: "auto", overflowX: "clip", height: "73%", padding: "10px"}} id={"toggle_widget_"+widgetIdx}>
      <ul style={{listStyleType: "none", padding: 10, margin: 0}}>
        {renderItems()}
      </ul>
    </div>
  )
}