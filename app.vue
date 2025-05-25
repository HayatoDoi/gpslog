<template>
  <div class="map">
    <LMap
      ref="map"
      :zoom="map.zoom"
      :center="map.center"
      :use-global-leaflet="true"
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
  <div class="modal" v-if="this.page.modal === 'upload'">
    <div class="modal-contents">
      <div class="modal-header">
        <p>ファイルのアップロード</p>
        <UButton class="modal-close" icon="material-symbols:close-rounded"
         size="lg" color="neutral" variant="outline" @click="this.page.modal = ''"/>
      </div>
      <div class="modal-body">
        <p>Google Mapアプリからエクスポートした location-history.json ファイルをアップロードしてください。</p>
        <p>location-history.json のエクスポート方法は <a href="">こちら</a>。</p>
        <UButton class="file-upload-erea" icon="fluent-mdl2:attach"
        color="neutral" variant="outline" @click="upload">アップロード</UButton>
        <input id="file-input" type="file" hidden accept=".json" multiple @change="import_data">
      </div>
    </div>
  </div>
  <div class="date">
    <input type="button" value="<<" @click="time_rewind('-month')">
    <input type="button" value="<" @click="time_rewind('-day')">
    <input v-model="html_input.begin" type="date" @change="update_map"></input>
      〜
    <input v-model="html_input.end" type="date" @change="update_map"></input>
    <input type="button" value=">" @click="time_rewind('+day')">
    <input type="button" value=">>" @click="time_rewind('+month')">
  </div>
</template>
<style>
  * {
    touch-action: manipulation;
  }

  body,
  html,
  #__nuxt,
  #__layout,
  .map,
  .modal {
    width: 100%;
    height: 100%;
  }

  .map {
    position: absolute;
    z-index: 50;
  }

  .modal {
    position: absolute;
    z-index: 100;
    background-color: rgba(0, 0, 0, 0.6);
  }

  .modal .modal-contents {
    position: absolute;
    z-index: 110;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: auto;
    background-color: white;
    width: 80%;
    height: 50%;
    border-radius: 10px;
  }

  .modal .modal-contents .modal-header {
    /* height: 10%; */
    padding: 5%;
    padding-bottom: 2.5%;
    display: flow-root;
  }

  .modal .modal-contents .modal-header p {
    height: 5%;
    float: left;
    text-align: left;
  }

  .modal .modal-contents .modal-header .modal-close {
    text-align: right;
    float: right;
  }

  .modal .modal-contents .modal-body {
    text-align: left;
    padding: 5%;
    padding-top: 0%;
  }

  .file-upload-erea {
    text-align: center;
    width: 80%;
    padding: 10%;
    margin: 10%;
    margin-top: 5%;
    margin-bottom: 2.5%;
    height: 15%;
    border: 2px dashed #00C16A;
    border-radius: 10px;

  }

  .file-upload-erea:hover {
    background-color: #b3f5d132;
    border: 2px dashed #016538;
  }

  .date {
    position: absolute;
    text-align: center;
    width: 100%;
    z-index: 90;
    top: 100%;
    left: 0;
    right: 0;
    height: 50px;
    transform: translateY(-110%);
  }
</style>
<script>
  import L from 'leaflet'
  const DEFINES = {
    TOKYO_STATION: [35.68114, 139.767061],
    DEFAULT_ZOOM: 6,
    TODAY: new Date().toISOString().substring(0, 10),
  };
  export default {
    data() {
      return {
        page: {
          modal: 'upload',
        },
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
          }),
          zoom: DEFINES.DEFAULT_ZOOM,
        },
        timeoutID: {
          zoom: -1,
        },
        raw_data: new this.$LocationHisrtoryJson(),
      }
    },
    methods: {
      /* アップロードボタンが押されたときに呼び出される関数 */
      upload() {
        /* input要素を強制発火させる */
        const elem = document.getElementById('file-input');
        elem.click();
      },
      /* ファイルのアップロード時に呼び出される関数 */
      async import_data(e) {
        this.raw_data = new this.$LocationHisrtoryJson();
        const files = e.target.files;
        for (const file of files) {
          const text = await file.text();
          this.raw_data.load(text);
        }
        this.update_map();
        this.page.modal = '';
      },
      /* 日付送り・戻しボタンを押したときに呼び出される関数 */
      time_rewind(type) {
        let begin = new Date(this.html_input.begin);
        let end = new Date(this.html_input.end);
        switch (type) {
          case '-month':
            begin.setMonth(begin.getMonth() - 1);
            end.setMonth(end.getMonth() - 1);
            break;
          case '-day':
            begin.setDate(begin.getDate() - 1);
            end.setDate(end.getDate() - 1);
            break;
          case '+day':
            begin.setDate(begin.getDate() + 1);
            end.setDate(end.getDate() + 1);
            break;
          case '+month':
            begin.setMonth(begin.getMonth() + 1);
            end.setMonth(end.getMonth() + 1);
            break;
        }
        this.html_input.begin = begin.toISOString().substring(0, 10);
        this.html_input.end = end.toISOString().substring(0, 10);
        this.update_map();
      },
      update_map() {
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
        /* 中心点とズームレベルを更新 */
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
          this.map.zoom = DEFINES.DEFAULT_ZOOM;
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
        let zoomX = 1;
        const distanceX = (east - west) * (500 / window.innerWidth);
        for (zoomX = 1; distanceX < (180 / (2 ** zoomX)); zoomX++);
        let zoomY = 1;
        const distanceY = (north - south) * (500 / window.innerHeight);
        for (zoomY = 1; distanceY < (180 / (2 ** zoomY)); zoomY++);
        /* 中心点の更新を実行してからすぐにズームレベルを更新すると、
         * 中心点がずれるため、時間を250msec空けてからズームレベルを更新する */
        if (this.timeoutID.zoom !== -1) {
          clearTimeout(this.timeoutID.zoom);
        }
        this.timeoutID.zoom = setTimeout((zoom) => {
          this.map.zoom = zoom;
        }, 250, zoomX < zoomY ? zoomX : zoomY);
      },
    }
  }
</script>
