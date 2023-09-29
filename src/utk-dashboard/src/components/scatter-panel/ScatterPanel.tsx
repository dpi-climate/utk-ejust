import { VegaLite } from 'react-vega'
import { VisualizationSpec } from 'vega-embed'
import { FieldType } from "../../types/Types"
import { useState } from 'react'

// import { ScatterOptions } from '../scatter-options'

interface ScatterPanelProps {
    fields: FieldType[]
    data: any[]
    setScatter: any
}

const ScatterPanel = ({ fields, data, setScatter } : ScatterPanelProps) => {

  const [x, setX] = useState<string>("")
  const [y, setY] = useState<string>("")

  if(data.length === 0) { return <div></div> }

  // const scatterOptions = () => {

  //   function renderItems() {
  //     return fields.map(f => {
  //       return (
  //         <div 
  //           className="dropdown-item"
  //           key={`scatter-dropdown-item-${f.key}`}
  //           onClick={() => console.log("clicked")}
  //           >
  //             {f.name}
  //         </div>
  //       )
  //     })
  //   }
  
  //   return (
  //     <div className="btn-group">
  //       <button type="button" className="btn scatter-dropdown dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
  //         {/* {label} */} {axis}
  //       </button>
  //       <ul className="dropdown-menu">
  //         { renderItems() }
  //       </ul>
  //     </div>
  //   )
  // }
  

  const scatter: VisualizationSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    // "data": {"url": "https://raw.githubusercontent.com/vega/vega/main/docs/data/cars.json"},
    "data": {"values": data},
    "width": 250,
    "height": 250,
    "mark": "circle",
    "encoding": {
      "x": {"field": "Horsepower", "type": "quantitative"},
      "y": {"field": "Miles_per_Gallon", "type": "quantitative"}
    },
  }

  return(
    <>
    <div>
      {/* <ScatterOptions fields={fields} axis= "X" setData={setScatter}/> */}
      {/* <ScatterOptions fields={fields} axis= "Y" setData={setScatter}/> */}
      <VegaLite
        spec={scatter}
        actions={false}
        renderer={'svg'}
      />
    </div>
    </>
  )

}

export { ScatterPanel }