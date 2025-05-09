<template>
  <div>
    <LMap
      ref="map"
      :zoom="6"
      :center="map.center"
      :use-global-leaflet="false"
      style="height: 350px"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <template v-for="marker in map.markers">
        <LMarker :lat-lng="marker" draggable />
      </template>
    </LMap>
  </div>
  <div>
    <input type="file" accept=".json" @change="change"><br>
    <input v-model="begin" type="date"></input>〜<input v-model="end" type="date"></input>
  </div>
</template>
<script>
  export default {
    data () {
      return {
        begin: '1970-01-01',
        end: new Date().toISOString().substring(0, 10),
        map: {
          markers: [],
          center: [0, 0],
        }
      }
    },
    methods: {
      async change(e) {
        this.map.markers = [];
        const file = e.target.files[0];
        const text = await file.text();
        const obj = JSON.parse(text);
        let kml = new this.$KML();
        obj.forEach(element => {
          const name = '';
          const begin = new Date(element.startTime);
          const end = new Date(element.endTime);
          if (begin < new Date(this.begin) || end > new Date(this.end)) {
            return;
          }
          if (element.visit !== undefined) {
            let location = element.visit.topCandidate.placeLocation.replace('geo:', '').split(',');
            let latitude = location[0];
            let longitude = location[1];
            this.map.markers.push([parseFloat(latitude), parseFloat(longitude)]);
            kml.addPlace(name, latitude, longitude, begin, end);
          }
          else if (element.activity !== undefined) {
            let lstart = element.activity.start.replace('geo:', '').split(',');
            let lend = element.activity.end.replace('geo:', '').split(',');
            let lines = [[lstart[1], lstart[0]], [lend[1], lend[0]]];
            kml.addLines(name, lines, begin, end);
          }
          else if (element.timelinePath != undefined) {
            let lines = [];
            element.timelinePath.forEach(path => {
              let location = path.point.replace('geo:', '').split(',');
              lines.push([location[1], location[0]]);
            });
            kml.addLines(name, lines, begin, end);
          }
        });
        console.log(kml.toString());
        this.adjustMap();
      },
      adjustMap() {
        if (this.map.markers.length == 0) {
          this.map.center = [0, 0];
          return;
        }
        let north = this.map.markers[0][0], south = this.map.markers[0][0];
        let east = this.map.markers[0][1], west = this.map.markers[0][1];
        this.map.markers.forEach(marker => {
          let latitude = marker[0];
          let longitude = marker[1];
          north = latitude > north ? latitude : north;
          south = latitude < south ? latitude : south;
          east = longitude > east ? longitude : east;
          west = longitude < west ? longitude : west;
        });
        this.map.center = [(north+south)/2, (east+west)/2];
      },
    }
  }
</script>