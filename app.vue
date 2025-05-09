<template>
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
      }
    },
    methods: {
      async change(e) {
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
            let latitude = location[1];
            let longitude = location[0];
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
      }
    }
  }
</script>