import React, { useRef } from "react";
import './View.css';

// declaring the types of the props
type GenericFixedPlotProps = {
    id: any,
    svgId: string
}

export const GenericFixedPlotContainer = ({
    id,
    svgId
}: GenericFixedPlotProps
) =>{
    
    return(
        <React.Fragment key={id}>
            <div style={{padding: 0, width: "100%", height: "100%"}}>
                <div id={svgId}>
                </div>
            </div>
        </React.Fragment>
    )
}