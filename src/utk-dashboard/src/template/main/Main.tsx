import './Main.css'
import React from 'react'

function Main (props:any) { 
    return (
    <React.Fragment>
        <main className="content container-fluid">
            {/* <div className="p-3 mt-3"> */}
            <div className="p-2 mt-2">
                {props.children}
            </div>
        </main>
    </React.Fragment>
    )
}

export { Main }