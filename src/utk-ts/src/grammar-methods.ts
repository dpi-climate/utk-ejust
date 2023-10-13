import { IGrammar } from './interfaces';

export class GrammarMethods {

    static grammar: IGrammar;

    static subscribers: Function[] = [];

    static applyGrammar(url_string: string | undefined, grammar: any): Promise<any> {

        let url = "http://localhost:5001";

        console.log("here is my new grammar", JSON.stringify({"grammar": grammar}));

        if(url_string != undefined){
            url = url_string;
        }

        let fetch_promise = fetch(url+"/updateGrammar", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"grammar": grammar})
        })

        fetch_promise.then((reponse) => {
            for(const subscriber of GrammarMethods.subscribers){
                console.log("calling subscribed functions", grammar);
                subscriber(grammar);
            }
        })

        return fetch_promise;
    }

    static subscribe(subscription_callback: Function){
        console.log("Called subscribe")
        GrammarMethods.subscribers.push(subscription_callback);
    }

    static updateGrammar(data: IGrammar): void {
        this.grammar = data;
    }

}
