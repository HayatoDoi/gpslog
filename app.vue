<template>
  <div>
    <LMap
      ref="map"
      :zoom="6"
      :center="map.center"
      :use-global-leaflet="true"
      style="height: 350px"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <template v-for="marker in map.markers">
        <LMarker :lat-lng="marker" :icon="map.icon" />
      </template>
      <template v-for="line in map.lines">
        <LPolyline :lat-lngs="line" color="green" />
      </template>
    </LMap>
  </div>
  <div>
    <input type="file" accept=".json" multiple @change="change"><br>
    <input v-model="html_input.begin" type="date"></input>〜<input v-model="html_input.end" type="date"></input>
  </div>
</template>
<script>
  import L from 'leaflet'
  export default {
    data () {
      return {
        html_input: {
        begin: '1970-01-01',
          end: new Date().toISOString().substring(0, 10), // 今日
        },
        map: {
          markers: [],
          lines: [],
          center: [35.68114, 139.767061],
          icon: L.icon({
              iconUrl: 'icon.png',
              iconSize: [5, 5],
          })
        }
      }
    },
    methods: {
      async change(e) {
        this.map.markers = [];
        this.map.lines = [];
        let kml = new this.$KML();
        const files = e.target.files;
        for (const file of files) {
          const text = await file.text();
          const obj = JSON.parse(text);
          for (const element of obj) {
            const name = '';
            const begin = new Date(element.startTime);
            const end = new Date(element.endTime);
            if (this.isIncludeHtmlTime(begin, end) === false) {
              continue;
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
              this.map.lines.push([lstart, lend]);
              kml.addLines(name, lines, begin, end);
            }
            else if (element.timelinePath != undefined) {
              let lines = [];
              this.map.lines.push([]);
              const tail = this.map.lines.length - 1;
              element.timelinePath.forEach(path => {
                let location = path.point.replace('geo:', '').split(',');
                lines.push([location[1], location[0]]);
                this.map.lines[tail].push([location[0], location[1]]);
              });
              kml.addLines(name, lines, begin, end);
            }
          }
        }
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
      /* HTMLで指定した期間に引数で指定した期間が含まれるか否か */
      isIncludeHtmlTime(begin, end) {
        const time_diff = new Date('1970-01-01T00:00:00.000Z') - new Date('1970-01-01T00:00:00.000'); // 時差(日本なら+09:00)
        const html_time = {
          begin: new Date(this.html_input.begin) - time_diff,
          end: new Date(this.html_input.end) - time_diff + (new Date('1970-01-02T00:00:00.000Z') - 1),
        };
        if (begin < html_time.begin || end > html_time.end) {
          return false;
        }
        return true;
      },
    }
  }
</script>