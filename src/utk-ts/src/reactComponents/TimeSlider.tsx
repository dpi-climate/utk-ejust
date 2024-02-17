import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import Slider from '@mui/material/Slider';
import { IToggleKnotItem } from "../interfaces";
import Box from '@mui/material/Box';

// type TimeSliderProps = {
//   activeKnots: IToggleKnotItem[]


// }

// export const TimeSlider = ({activeKnots}:TimeSliderProps) => {
  export const TimeSlider = ({}) => {

  const [maxTimestep, setMaxTimestep] = useState<number>(0); // replace with minTstep
  const [minTimestep, setMinTimestep] = useState<number>(0); // replace with maxTstep

  const [sliderValue, setSliderValue] = useState<number[]>([0,1]); // replace with activeTstep

  const handleChangeSlider = () => {
    
  }

  
  // const render = () => {
  //   return
  //     <Slider
  //       key="_slider"
  //       defaultValue={0}
  //       valueLabelDisplay="off"
  //       step={100}
  //       // marks = {0}
  //       // onChange={}
  //       // disabled = {}
  //     />
    
  // }

  const marks = [
    {
      value: 0,
      label: '0h',
    },
    {
      value: 6,
      label: '6h',
    },
    {
      value: 12,
      label: '12h',
    },
    {
      value: 18,
      label: '18h',
    },
    {
      value: 24,
      label: '24h',
    },
  ];

  function valuetext(value: number) {
    return `${value}h`;
  }

  return <Slider
            aria-label="Temperature"
            key="_slider"
            defaultValue={0} // where it starts
            // valueLabelDisplay="off"
            valueLabelDisplay="auto"
            getAriaValueText={valuetext}
            // step={null}
            step={1}
            marks={marks}
            min={0}
            max={24}
            // marks = {[{value: 0, label: "0"}, {value: 1, label: "1"}, {value: 2, label: "2"}]}
            // onChange={}
            // disabled = {}
          />
}