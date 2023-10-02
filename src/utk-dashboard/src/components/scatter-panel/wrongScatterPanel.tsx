import { VegaLite } from 'react-vega'
import { VisualizationSpec } from 'vega-embed'
import { FieldType } from "../../types/Types"
import { useState } from 'react'
import "./ScatterPanel.css"
// import { ScatterOptions } from '../scatter-options'

interface ScatterPanelProps {
    fields: FieldType[]
    data: any[]
    setScatter: any
}

interface DropdownProps {
  axis: "X" | "Y"
  label: string
  activeField: FieldType
}

const ScatterPanel = ({ fields, data, setScatter } : ScatterPanelProps) => {

  
  
  const initialXLabel = fields.length > 0 ? fields[0].nick : ""
  // const initialXField = fields.length > 0 ? fields[0] : {}
  
  const initialYLabel = fields.length > 0 ? fields[1].nick : ""
  // const initialYField = fields.length > 0 ? fields[1] : {}
  
  const [xDrop, setXDrop] = useState<DropdownProps>({ axis: "X", label: initialXLabel, activeField: fields[0]})
  const [yDrop, setYDrop] = useState<DropdownProps>({ axis: "Y", label: initialYLabel, activeField: fields[1]})
  
  if(fields.length === 0 || data.length === 0 || xDrop.activeField === undefined || yDrop.activeField === undefined ) { 
    return <div></div> 
  }

  function handleClick(ax: DropdownProps, fld:FieldType, setAxis: typeof setXDrop | typeof setYDrop) {
    setAxis({ axis: ax.axis, label: fld.nick, activeField: fld})
  }
  
  const scatter: VisualizationSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    // "data": {"url": "https://raw.githubusercontent.com/vega/vega/main/docs/data/cars.json"},
    "data": {"values": data},
    "width": 250,
    "height": 250,
    "mark": "circle",
    "encoding": {
      "x": {"field": `${xDrop.activeField.key}`, "type": "quantitative"},
      "y": {"field": `${yDrop.activeField.key}`, "type": "quantitative"}
    },
  }

  // return <div>To do</div>
  
  return(
    <>
    <div className="scatter-dropdown">
      <button className="scatter-dropbtn">{`${xDrop.axis}: ${xDrop.label}`}</button>
      <div className="scatter-dropdown-content">
        {
          fields.map(f => {
            return (
              <button 
                className='dropdown-item' 
                key={`scatter-drop-item-${f.key}`}
                onClick={() => handleClick(xDrop, f, setXDrop)}>{`${f.name}`}</button>
            )
          })
        }
      </div>
    </div>

    <div className="scatter-dropdown">
      <button className="scatter-dropbtn">{`${yDrop.axis}: ${yDrop.label}`}</button>
      <div className="scatter-dropdown-content">
        {
          fields.map(f => {
            return (
              <button 
                className='dropdown-item' 
                key={`scatter-drop-item-${f.key}`}
                onClick={() => handleClick(yDrop, f, setYDrop)}>{`${f.name}`}</button>
            )
          })
        }
      </div>
    </div>
      <VegaLite
        spec={scatter}
        actions={false}
        renderer={'svg'}
      />
    </>
  )
}

export { ScatterPanel }