---
title: nodata v0.0.1
language_tabs:
  - shell: Shell
language_clients:
  - shell: ""
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="nodata">nodata v0.0.1</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Template project

Base URLs:

* <a href="/api">/api</a>

License: <a href="https://github.com/hieule3004/nest-template/blob/master/LICENSE.md">MIT</a>

# Authentication

- HTTP Authentication, scheme: basic 

- HTTP Authentication, scheme: bearer 

<h1 id="nodata-default">Default</h1>

## getHello

<a id="opIdgetHello"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/ \
  -H 'Accept: application/json'

```

`GET /`

> Example responses

> 200 Response

```json
"string"
```

<h3 id="gethello-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|string|

<aside class="success">
This operation does not require authentication
</aside>

## getError

<a id="opIdgetError"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/error

```

`GET /error`

<h3 id="geterror-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<aside class="success">
This operation does not require authentication
</aside>

## getArray

<a id="opIdgetArray"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/array \
  -H 'Accept: application/json'

```

`GET /array`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getarray-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

<h3 id="getarray-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## getRfc

<a id="opIdgetRfc"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/rfc/{value} \
  -H 'Accept: application/json'

```

`GET /rfc/{value}`

<h3 id="getrfc-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|value|path|number|true|none|

> Example responses

> 200 Response

```json
{
  "result": true
}
```

<h3 id="getrfc-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RfcResponse](#schemarfcresponse)|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_RfcResponse">RfcResponse</h2>
<!-- backwards compatibility -->
<a id="schemarfcresponse"></a>
<a id="schema_RfcResponse"></a>
<a id="tocSrfcresponse"></a>
<a id="tocsrfcresponse"></a>

```json
{
  "result": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|result|boolean|true|none|none|

<h2 id="tocS_DotenvDto">DotenvDto</h2>
<!-- backwards compatibility -->
<a id="schemadotenvdto"></a>
<a id="schema_DotenvDto"></a>
<a id="tocSdotenvdto"></a>
<a id="tocsdotenvdto"></a>

```json
{
  "ENV": "local",
  "PORT": 0,
  "API_PREFIX": "/api",
  "LOGLEVEL": "ERROR"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|ENV|string|true|none|none|
|PORT|number|true|none|none|
|API_PREFIX|string|true|none|none|
|LOGLEVEL|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|ENV|local|
|ENV|dev|
|ENV|prod|
|ENV|stage|
|LOGLEVEL|ERROR|
|LOGLEVEL|WARN|
|LOGLEVEL|INFO|
|LOGLEVEL|VERBOSE|
|LOGLEVEL|DEBUG|

