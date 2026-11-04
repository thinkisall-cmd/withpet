declare namespace kakao.maps {
  function load(callback: () => void): void

  class Map {
    constructor(el: HTMLElement, opts: { center: LatLng; level: number })
    setCenter(latlng: LatLng): void
  }

  class LatLng {
    constructor(lat: number, lng: number)
  }

  class Marker {
    constructor(opts: { position: LatLng; map?: Map; title?: string })
    setMap(map: Map | null): void
    setPosition(latlng: LatLng): void
  }

  class CustomOverlay {
    constructor(opts: { position: LatLng; content: string | HTMLElement; map?: Map; zIndex?: number })
    setMap(map: Map | null): void
    setPosition(latlng: LatLng): void
  }

  class Polyline {
    constructor(opts: {
      map?: Map
      path: LatLng[]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeStyle?: string
    })
    setMap(map: Map | null): void
  }

  namespace event {
    function addListener(target: object, type: string, handler: () => void): void
  }
}
