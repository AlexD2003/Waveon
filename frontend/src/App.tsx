import { useState } from 'react'
import {StartComponent} from "./components/StartComponent.tsx";
import {PrimeReactProvider} from "primereact/api";

import 'primereact/resources/themes/md-dark-deeppurple/theme.css';
import 'primeicons/primeicons.css'; //icons
import 'primeflex/primeflex.css'; // flex
import './App.css'


function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <PrimeReactProvider>
                <StartComponent></StartComponent>
            </PrimeReactProvider>
        </>
    )
}

export default App
