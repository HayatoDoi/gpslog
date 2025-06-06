<template>
  <input id="file-import" type="file" hidden accept=".json,.kml" multiple @change="import_data">
  <a id='file-export' hidden download='location-history.kml' @click="export_data"></a>
  <div class="map">
    <LMap
      ref="map"
      :options="{ zoomControl: false }"
      :zoom="map.zoom"
      :center="map.center"
      :use-global-leaflet="true"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&amp;copy; <a href=&quot;https://github.com/HayatoDoi/gpslog&quot;>HayatoDoi</a>"
      >
      </LTileLayer>
      <LControl position="bottomright">
        <UButton color="neutral" size="xl" variant="subtle"
         icon="material-symbols:attach-file-add"
         @click="modal.file_upload = true" title="ファイルのアップロード" />
        <br>
        <UButton color="neutral" size="xl" variant="subtle"
         icon="material-symbols:download"
         @click="modal.file_download = true" title="ファイルのダウンロード" />
        <br>
        <UButton color="neutral" size="xl" variant="subtle"
         icon="material-symbols:settings-outline"
         @click="modal.settings = true" title="設定を変更する" />
        <div class="zoom-menu">
          <UButton color="neutral" size="xl" variant="subtle"
          icon="material-symbols:add"
          @click="map.zoom++" title="拡大" />
          <br>
          <UButton color="neutral" size="xl" variant="subtle"
          icon="material-symbols:remove"
          @click="map.zoom--" title="縮小" />
        </div>
      </LControl>
      <template v-for="marker in map.markers">
        <LMarker :lat-lng="marker" :icon="map.icon" />
      </template>
      <template v-for="line in map.lines">
        <LPolyline :lat-lngs="line" color="green" />
      </template>
    </LMap>
  </div>
  <UModal v-model:open="modal.file_upload" title="ファイルのアップロード">
    <template #body>
      <p>iPhoneのGoogle Mapアプリ、または、Androidの設定アプリからダウンロードしたjsonファイルをアップロードしてください。</p>
      <p>jsonファイルのダウンロード方法は <a href="">こちら</a> 。</p>
      <UButton :loading="modal.file_loading" class="file-upload-erea" icon="material-symbols:attach-file-add"
       color="neutral" variant="outline" @click="upload">アップロード</UButton>
      <p style="color:red"> {{ modal.file_error }}</p>
    </template>
  </UModal>
  <UModal v-model:open="modal.file_download" title="ファイルのダウンロード">
    <template #body>
      <p>Google My Mapsなどに読み込ませることができるkmlファイルをダウンロードします。</p>
      <UButton :loading="modal.file_loading" class="file-upload-erea" icon="material-symbols:download"
       color="neutral" variant="outline" @click="download">ダウンロード</UButton>
      <p style="color:red"> {{ modal.file_error }}</p>
    </template>
  </UModal>
  <UModal v-model:open="modal.settings" title="設定を変更する">
    <template #body>
      <UCheckbox v-model="settings.is_fix_google_bug" @change="update_settings"
       size="lg" label="Googleマップのデータ飛び問題を修正する(β版)"/>
    </template>
  </UModal>
  <div class="bottom-menu">
    <p>{{ this.distance }}km</p>
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:keyboard-double-arrow-left"
     @click="time_rewind('-month')" title="前月に戻る" />
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:chevron-left"
     @click="time_rewind('-day')" title="前日に戻る" />
    <UPopover>
      <UButton color="neutral" size="lg" variant="subtle" icon="material-symbols:calendar-month" title="日付を選択" >
        <template v-if="isOneDay()">
          {{ calendar.start.toString().replaceAll('-', '/') }}
        </template>
        <template v-else>
          {{ calendar.start.toString().replaceAll('-', '/') }}
          -
          {{ calendar.end.toString().replaceAll('-', '/') }}
        </template>
      </UButton>
      <template #content>
        <UCalendar size="xl" v-model="calendar" class="p-2" range
         @update:model-value="update_map">
          <template #day="{ day }">
            <UChip :show="!!getCalenderChip(day)" color="success" :size="getCalenderChip(day)">
            {{ day.day }}
            </UChip>
          </template>
        </UCalendar>
      </template>
    </UPopover>
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:chevron-right"
     @click="time_rewind('+day')" title="翌日に進む" />
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:keyboard-double-arrow-right"
     @click="time_rewind('+month')" title="翌月に進む" />
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
  .map {
    width: 100%;
    height: 100%;
  }

  .map {
    position: absolute;
    z-index: 50;
  }

  .file-upload-erea {
    text-align: center;
    width: 100%;
    margin-top: 30px;
    height: 100px;
    border: 2px dashed #00C16A;
    border-radius: 10px;

  }

  .file-upload-erea:hover {
    background-color: #b3f5d132;
    border: 2px dashed #016538;
  }

  .zoom-menu {
    margin-top: 40px;
    margin-bottom: 80px;
  }

  .bottom-menu {
    position: absolute;
    text-align: center;
    width: 100%;
    z-index: 90;
    top: 100%;
    left: 0;
    right: 0;
    height: 80px;
    transform: translateY(-110%);
  }
</style>
<script>
  import L from 'leaflet';
  import { CalendarDate } from '@internationalized/date';
  const DEFINES = {
    TOKYO_STATION: [35.68114, 139.767061],
    DEFAULT_ZOOM: 6,
    TODAY: {
      YEAR: new Date().getFullYear(),
      MONTH: new Date().getMonth() + 1,
      DAY: new Date().getDate(),
    },
    GOOGLE_BUG_FIX_FILTER: (b, e, v) => (v.user_handle?.style === 'old'),
  };
  export default {
    data() {
      return {
        modal: {
          file_upload: true,
          file_loading: false,
          file_error: '',
          file_download: false,
          settings: false,
        },
        calendar: {
          start: new CalendarDate(
            DEFINES.TODAY.YEAR, DEFINES.TODAY.MONTH, DEFINES.TODAY.DAY),
          end: new CalendarDate(
            DEFINES.TODAY.YEAR, DEFINES.TODAY.MONTH, DEFINES.TODAY.DAY),
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
        settings: {
          /* Googleマップのデータ飛び問題を修正するか否か */
          is_fix_google_bug: true,
          filter: DEFINES.GOOGLE_BUG_FIX_FILTER,
        },
        distance: 0.0,
        timeoutID: {
          zoom: -1,
        },
        raw_data: new this.$TimeLineJson(),
      }
    },
    methods: {
      update_settings() {
        this.settings.filter = null;
        if (this.settings.is_fix_google_bug == true) {
          this.settings.filter = DEFINES.GOOGLE_BUG_FIX_FILTER;
        }
        this.update_map();
      },
      /* カレンダー上に表示するチップサイズを計算する関数 */
      getCalenderChip(calendar_date) {
        const begin = calendar_date.toDate();
        let end = calendar_date.toDate();
        end.setDate(end.getDate() + 1);
        end.setSeconds(end.getSeconds() - 1);
        const distance = this.raw_data.getDistance(begin, end,
          this.settings.filter);
        if (distance < 1.0) {
          return undefined;
        }
        if (distance < 10.0) {
          return '3xs';
        }
        if (distance < 50.0) {
          return '2xs';
        }
        return 'xs';
      },
      /* アップロードボタンが押されたときに呼び出される関数 */
      upload() {
        /* input要素を強制発火させる */
        const elem = document.getElementById('file-import');
        elem.click();
      },
      /* ファイルのアップロード時に呼び出される関数 */
      async import_data(e) {
        this.modal.file_loading = true;
        try {
          let time_line_json = new this.$TimeLineJson();
          let time_line_kml = new this.$TimeLineKml();
          const files = e.target.files;
          for (const file of files) {
            const text = await file.text();
            if (file.name.endsWith('.kml')) {
              time_line_kml.load(text);
            }
            if (file.name.endsWith('.json')) {
              time_line_json.load(text);
            }
          }
          this.raw_data = new this.$TimeLine(time_line_json, time_line_kml);
          const current_date = this.raw_data.getMaxDate();
          const year = current_date.getFullYear();
          const month = current_date.getMonth() + 1;
          const day = current_date.getDate();
          this.calendar.end = this.calendar.start =
            new CalendarDate(year, month, day);
          this.update_map();
        }
        catch (error) {
          console.error(error);
          this.modal.file_error = 'ファイルの読み込みに失敗しました';
          this.modal.file_loading = false;
          return;
        }
        this.modal = {};
      },
      download() {
        /* a要素を強制発火させる */
        const elem = document.getElementById('file-export');
        elem.click();
      },
      export_data() {
        this.modal.file_loading = true;
        try {
          /* 日付の計算 */
          const begin = this.calendar.start.toDate();
          let end = this.calendar.end.toDate();
          end.setDate(end.getDate() + 1);
          end.setSeconds(end.getSeconds() - 1);
          let kml = new this.$TimeLineKml(this.raw_data);
          const content = kml.toString(begin, end, this.map.filter);
          /* ダウウンロード開始 */
          const elem = document.getElementById('file-export');
          let blob = new Blob([content], { type: 'text/plain' });
          elem.href = window.URL.createObjectURL(blob);
        }
        catch (error) {
          console.error(error);
          this.modal.file_error = 'ファイルの生成に失敗しました';
          this.modal.file_loading = false;
          return;
        }
        this.modal = {};
      },
      /* 選択された日付が一日か否か */
      isOneDay() {
        return this.calendar.start.compare(this.calendar.end) === 0;
      },
      /* 日付送り・戻しボタンを押したときに呼び出される関数 */
      time_rewind(type) {
        switch (type) {
          case '-month':
            this.calendar.start =
              this.calendar.start.subtract({months: 1});
            this.calendar.end =
              this.calendar.end.subtract({months: 1});
            break;
          case '-day':
            this.calendar.start =
              this.calendar.start.subtract({days: 1});
            this.calendar.end =
              this.calendar.end.subtract({days: 1});
            break;
          case '+day':
            this.calendar.start =
              this.calendar.start.add({days: 1});
            this.calendar.end =
              this.calendar.end.add({days: 1});
            break;
          case '+month':
            this.calendar.start =
              this.calendar.start.add({months: 1});
            this.calendar.end =
              this.calendar.end.add({months: 1});
            break;
        }
        this.update_map();
      },
      update_map() {
        /* 日付の計算 */
        const begin = this.calendar.start.toDate();
        let end = this.calendar.end.toDate();
        end.setDate(end.getDate() + 1);
        end.setSeconds(end.getSeconds() - 1);
        /* 距離の更新 */
        this.distance = this.raw_data.getDistance(begin, end,
          this.settings.filter);
        /* マーカーの更新 */
        this.map.markers = [];
        const visits = this.raw_data.getVisits(begin, end,
          this.settings.filter);
        for (const visit of visits) {
          this.map.markers.push([
            visit.point.latitude,
            visit.point.longitude
          ]);
        }
        /* ラインの更新 */
        this.map.lines = [];
        const activities = this.raw_data.getActivities(begin, end,
          this.settings.filter);
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
