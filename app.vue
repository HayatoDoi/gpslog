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
  const DEFINES = {
    TOKYO_STATION: [35.68114, 139.767061],
    TODAY: new Date().toISOString().substring(0, 10),
  };
  export default {
    data() {
      return {
        html_input: {
          begin: DEFINES.TODAY,
          end: DEFINES.TODAY,
        },
        map: {
          markers: [],
          lines: [],
          center: DEFINES.TOKYO_STATION,
          icon: L.icon({
            iconUrl: 'icon.png',
            iconSize: [5, 5],
          })
        },
        raw_data: new this.$LocationHisrtoryJson(),
      }
    },
    methods: {
      /* ファイルのアップロード時に呼び出される関数 */
      async change(e) {
        this.raw_data = new this.$LocationHisrtoryJson();
        const files = e.target.files;
        for (const file of files) {
          const text = await file.text();
          this.raw_data.load(text);
        }
        this.adjustMap();
      },
      adjustMap() {
        /* 日付の計算 */
        const time_diff = new Date('1970-01-01T00:00:00.000Z')
          - new Date('1970-01-01T00:00:00.000'); // 時差(日本なら+09:00)
        const begin = new Date(this.html_input.begin) - time_diff;
        const end = new Date(this.html_input.end) - time_diff
          + (new Date('1970-01-02T00:00:00.000Z') - 1);
        /* マーカーの更新 */
        this.map.markers = [];
        const visits = this.raw_data.getVisits(begin, end);
        for (const visit of visits) {
          this.map.markers.push([
            visit.point.latitude,
            visit.point.longitude
          ]);
        }
        /* ラインの更新 */
        this.map.lines = [];
        const activities = this.raw_data.getActivities(begin, end);
        for (const activitiy of activities) {
          let line = [];
          for (const point of activitiy.points) {
            line.push([
              point.latitude,
              point.longitude
            ]);
          }
          this.map.lines.push(line);
        }
        /* 中心点の更新 */
        let latitudes = [];
        let longitudes = [];
        for (const lat_lng of this.map.markers) {
          latitudes.push(parseFloat(lat_lng[0]));
          longitudes.push(parseFloat(lat_lng[1]));
        };
        for (const line of this.map.lines) {
          for (const lat_lng of line) {
            latitudes.push(parseFloat(lat_lng[0]));
            longitudes.push(parseFloat(lat_lng[1]));
          }
        };
        if (latitudes.length === 0 || longitudes.length === 0) {
          this.map.center = DEFINES.TOKYO_STATION;
          return;
        }
        let north = latitudes[0], south = latitudes[0];
        let east = longitudes[0], west = longitudes[0];
        for (const latitude of latitudes) {
          north = latitude > north ? latitude : north;
          south = latitude < south ? latitude : south;
        }
        for (const longitude of longitudes) {
          east = longitude > east ? longitude : east;
          west = longitude < west ? longitude : west;
        }
        this.map.center = [(north + south) / 2, (east + west) / 2];
      },
    }
  }
</script>
