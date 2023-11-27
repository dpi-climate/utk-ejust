import { useRef, useEffect, useState } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";
import {Row} from 'react-bootstrap';

// drag box css
import './Dragbox.css'
// import the bar component to draw bars

// declaring the types of the props
type GenericScreenPlotProps = {
    id: any,
    disp: boolean,
    x: number,
    y: number,
    svgId: string,
    knotsByPhysical: any,
    activeKnotPhysical: any,
    updateStatus: any
}

export const GenericScreenPlotContainer = ({
    id,
    disp,
    x,
    y,
    svgId,
    knotsByPhysical,
    activeKnotPhysical,
    updateStatus
}: GenericScreenPlotProps
) =>{
    const nodeRef = useRef(null)
    const [selectActiveKnotPhysical, setSelectActiveKnotPhysical] = useState<any>({}); // object that, for each physical, stores the knotId of the activated knot

    useEffect(() => {
        setSelectActiveKnotPhysical(activeKnotPhysical);
    }, [activeKnotPhysical]);

    const updateActiveKnotPhysical = (physicalId: string, knotId: string) => {
        let returnObj: any = {};
        
        for(const key of Object.keys(selectActiveKnotPhysical)){

            if(key != physicalId){
                returnObj[key] = selectActiveKnotPhysical[key];
            }else{
                returnObj[key] = knotId;
            }
        }

        setSelectActiveKnotPhysical(returnObj);
        updateStatus("broadcastChannel", {id: "GenericScreenPlotcontainer", channel: "physicalKnotActiveChannel", message: {physicalId: physicalId, knotId: knotId}});
    }   

    return(
        <Draggable nodeRef={nodeRef} key={id} defaultPosition={{x: x, y: y}}>
            <div ref={nodeRef} className="drag-box" style={{display: disp ? 'block' : 'none', backgroundColor: "white", borderRadius: "8px", padding: "10px", border: "1px solid #dadce0", boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)", overflow: "auto", maxWidth: window.innerWidth/2, maxHeight: window.innerHeight, zIndex: 10}}>
                <Row className="justify-content-center">
                    {
                        (Object.keys(knotsByPhysical)).map((key: any) => {
                            return <div>
                                <label>{key}</label>
                                <select style={{width: "200px"}} key={"selectKnotsByPhysical"+key} value={selectActiveKnotPhysical[key]} onChange={e => updateActiveKnotPhysical(key, e.target.value)}>
                                    {
                                        knotsByPhysical[key].map((knotId: string) => (
                                            <option value={knotId} key={"optionKnotsByPhysical"+knotId}>{knotId}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        })
                    }
                </Row>
                <div id={svgId}>
                </div>
            </div>
        </Draggable>
    )
}