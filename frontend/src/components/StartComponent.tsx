import type {JSX} from "react";
import {Button} from "primereact/button";

export function StartComponent(): JSX.Element {
    return (
        <div>
            <div className="text-5xl font-italic">test</div>
            <Button icon="pi pi-search">Fancy Button</Button>
        </div>
    )
}