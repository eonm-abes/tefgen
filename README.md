<div align="center">

# Tefgen

_[TEF](https://www.theses.fr/schemas/tef/index.html) files generator_

[![build](https://github.com/eonm-abes/tefgen/actions/workflows/build.yml/badge.svg)](https://github.com/eonm-abes/tefgen/actions/workflows/build.yml)
[![Latest Build](https://img.shields.io/badge/%F0%9F%93%A6%20lastest%20build-tefgen.js-yellow)](https://github.com/eonm-abes/tefgen/releases/latest/download/lib.js)
[![GitHub release](https://img.shields.io/github/release/eonm-abes/winibw-algo-theses.svg)](https://github.com/eonm-abes/tefgen/releases/latest)
[![Contribution Welcome](https://img.shields.io/badge/contribution-welcome-green.svg)](https://github.com/eonm-abes/tefgen/pulls)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

Tefgen is a very minimalist TEF manipulation library that can perform value substitution and node deletion based on a xml template documents.

## API

### tefGen

A tef generator takes an xml document as a template and applies transformation to it.

All transformations are stored inside a javascript object. Storing transformation inside an object allows their reusability. The transformation object is splited in two parts : the selector (key), and the transformation (value).

```node
let tef_document = `
    <mets:metsHdr ID="AMUE.IMPORTWS.METS_HEADER" CREATEDATE="2012-06-28T09:43:21Z" LASTMODDATE="2012-06-28T09:58:06Z" RECORDSTATUS="valide">
        <mets:agent ROLE="CREATOR">
            <mets:name/>
            <mets:note>Lorem Ipsum</mets:note>
        </mets:agent>
        <mets:agent ROLE="DISSEMINATOR">
            <mets:name>ABES</mets:name>
        </mets:agent>
        <mets:altRecordID ID="AMUE.IMPORTWS.METS_HEADER.ALTERNATE" TYPE=""/>
    </mets:metsHdr>`
    
let tefgenerator = new tefGen(tef_document);

let transformations = {
    "mets:note": "My Note",
    "mets:agent[1]": new DeleteNode
}

tefgenerator.apply_properties(transformations)

console.log(tefgenerator.serialize())

/*  
<mets:metsHdr ID="AMUE.IMPORTWS.METS_HEADER" CREATEDATE="2012-06-28T09:43:21Z" LASTMODDATE="2012-06-28T09:58:06Z" RECORDSTATUS="valide">
	<mets:agent ROLE="CREATOR">
    	<mets:name/>
		<mets:note>My Note</mets:note>
	</mets:agent>
	<mets:altRecordID ID="AMUE.IMPORTWS.METS_HEADER.ALTERNATE" TYPE=""/>
</mets:metsHdr>
*/
```

### Nodes selection

Selector are used to select one or more xml node inside a document.

Considering the following xml document :

```xml
<xml>
	<pm:foo></pm:foo>
	<pm:bar></pm:bar>
	<pm:bar></pm:bar>
	<pm:bar></pm:bar>
</xml>
```

* The selector `pm:foo` will match all the occurences of : `<pm:foo></pm:foo>`
* The selector `pm:bar` will match all the occurences of : `<pm:foo></pm:foo>`

Selectors can have a quantifier operator `[DIGIT]`. Qualifier operators are inclusive and start at 0.

* The selector `pm:bar[0]` will match the first occurence of : `<pm:foo></pm:foo>`
* The selector `pm:bar[..2]` will match up to 3 occurences of  : `<pm:foo></pm:foo>`
* The selector `pm:bar[1..]` will match from the second to the last occurence of : `<pm:foo></pm:foo>`

### Basic value susbitutions

This transformation will replace the value of all pm:bar nodes with "My new value" :

```
let transformation = {
	"pm:bar": "My new value"
}
```

### Advanced value substitutions

__Array substitution based :__

This transformation will modifiy the first and the second nodes but not the following nodes if any.

```node
let transformation = {
	"pm:bar": ["new value of first pm:bar", "new value of second pm:bar"]
}
```

This transformation will let the second node untouched but will modify the first and the third.

```node
let transformation = {
	"pm:bar": ["new value of  first pm:bar", new KeepNode, "new value of third pm:bar"]
}
```

__Array substitution based with a default value :__

```node
let transformation = {
	"pm:bar": {values: ["new value of first pm:bar", "new value of second pm:bar"], default: new DeleteNode}
}
```

The first and the second nodes are modified and all other matchin nodes are deleted.

### __DeleteNode__

`DeleteNode` objects are used to delete nodes :

This transformation will delete all pm:bar nodes :

```node
let transformation = {
	"pm:bar": new DeleteNode
}
```

### __KeepNode__

`KeepNode` objects are used to keep nodes untouched. It's only usefull with array based modifications :

```node
// This transformation will delete all pm:bar nodes.
let transformation = {
	"pm:bar": [ new KeepNode, "new value of second pm:bar" ]
}
```

## Postman integration

Tefgen is build and designed to work inside postman.
