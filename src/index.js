import { DOMParser, XMLSerializer } from 'xmldom'

// Delete a node based on a condition (predicates). The predicate is optional and is sets to true by default.
export class DeleteNode {
    constructor(predicate) {
        this.predicate = predicate ? predicate : () => { return true };
    }

    check_predicate(xml_node, index) {
        return this.predicate(xml_node, index)
    }
};

// Keeps a node or a set of node untouched
export class KeepNode {};

// Parse a key ie mets:note[1..3] = {key: "mets:note", slice_start: 1, slice_end: 4}. Slices are inclusive.
// The key is used to select nodes with the function getElementsByTagName
class ParseKey {
    constructor(key) {
        const regex = /(?<key>.*?)(\[((?<index>\d+)|(?<delimited>\d+\.\.\d+)|(\.\.(?<end>\d+))|((?<start>\d+)\.\.))\])?$/

        var { groups: { key, index, delimited, end, start } }  = regex.exec(key);

        let slice_start = undefined;
        let slice_end = undefined;
        
        if (delimited) { // [0 .. 10]
            let splited_value = delimited.split("..").map((element) => parseInt(element, 10));
            slice_start = splited_value[0];
            slice_end =  splited_value[1] + 1;
        } else if (index) { // [3]
            index = parseInt(index, 10);
            slice_start = index;
            slice_end = index + 1;
        } else if (end) { // [..10]
            slice_end = parseInt(end, 10) + 1;
        } else if (start) { // [10..]
            slice_start = parseInt(start, 10);
        }
        
        return { key, slice_start, slice_end }
    }
}

/// Modify an existing tef
export class Gen {
    constructor(tef) {
        const parser = new DOMParser();
        this.tef = parser.parseFromString(tef,"text/xml");
    }

    // Uses the type or the instance of an object to dertermine the transformation function to use.
    // If no function is suitable nothing append.
    select_transformation_method(value) {              
        switch (typeof value) {
            case 'string':
                return (element, index, value) => {this.string_based_modification(element, index, value)};
            case 'object':
                if (value instanceof DeleteNode) {
                    return (element, index, current_value) => {
                        if (value.check_predicate(element, index) === true) {
                            this.null_based_modification(element, index, current_value)
                        }
                    }
                } else if (value instanceof KeepNode) {
                    () => {}
                } else if (Array.isArray(value)) {
                    return (element, index, value) => {this.array_based_modification(element, index, value)};
                } else {
                    return (element, index, value) => {this.object_based_modification(element, index, value)};
                }
            
            // otherwise return a function that does nothing
            default:
                return () => {}
        }
    }

    // Update the value of a given node
    string_based_modification(xml_element, string) {
        if (xml_element.firstChild) {
            let txt = this.tef.createTextNode(string);
           xml_element.firstChild = txt
        } else {
            let txt = this.tef.createTextNode(string);
            xml_element.appendChild(txt)
        }
    }

    // Removes a given XML node
    null_based_modification(xml_element) {
        this.tef.removeChild(xml_element);
    }

    object_based_modification(xml_element, object, current_index) {
        // object must look like this { values: ["a", "b", new KeepNode], default: new DeleteNode }
        if (object.values && Array.isArray(object.values)) {
           this.array_based_modification(xml_element, object.values, current_index, object.default);
        }
    }

    // Transforms a set of XML node with the content of an array at the same index.
    array_based_modification(xml_element, array, current_index, default_value) {
        if (array[current_index])  {
            let value = array[current_index];
            this.select_transformation_method(value)(xml_element, value, current_index);
        } else {
            default_value = default_value || new KeepNode
            this.select_transformation_method(default_value)(xml_element, default_value, current_index);
        }
    }

    // Applies transformation based on object values
    apply_properties(obj) {
        Object.entries(obj).forEach(entry => {
            let { key, slice_start, slice_end} = new ParseKey(entry[0]);           
            let value= entry[1];

            let used_method = this.select_transformation_method(value);            

            Array.from(this.tef.getElementsByTagName(key)).slice(slice_start, slice_end).forEach((element, index) => {
                used_method(element, value, index);
            });
        })
    }

    // Serialize back the TEF to xml
    serialize() {
        let serializer = new XMLSerializer();
        return serializer.serializeToString(this.tef)
    }

    // Encode the TEF to base64
    encode_to_base64() {
        let b64tef = Buffer.from(this.serialize()).toString('base64');
        return b64tef
    }
}

function computeMonth(month) {
    let today = new Date();
    today.setMonth(today.getMonth()+ month);
    return today.toISOString().split('T')[0]
}


// let tef_document = `
//     <mets:metsHdr ID="AMUE.IMPORTWS.METS_HEADER" CREATEDATE="2012-06-28T09:43:21Z" LASTMODDATE="2012-06-28T09:58:06Z" RECORDSTATUS="valide">
//         <note>2020</note>
//         <note>2</note>
//         <note>3</note>
//         <note>test</note>
//         <mets:agent ROLE="CREATOR">
//             <mets:name/>
//             <mets:note>2020</mets:note>
//         </mets:agent>
//         <mets:agent ROLE="DISSEMINATOR">
//             <mets:name>ABES</mets:name>
//         </mets:agent>
//         <mets:altRecordID ID="AMUE.IMPORTWS.METS_HEADER.ALTERNATE" TYPE=""/>
//     </mets:metsHdr>`


// let tefgenerator = new tefGen(tef_document);
// tefgenerator.apply_properties({
    
//     "note[2]": {values: ["b", new DeleteNode ]},
//     // "mets:agent": {values: [new KeepNode, new KeepNode]},
//     "mets:altRecordID": "eeeeeee"
// })

// console.log(tefgenerator.serialize())
// console.log(tefgenerator.encode_to_base64())

