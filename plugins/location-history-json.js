class LocationHisrtoryJson {
  __visits = [];/* 訪問場所 */
  __activities = []; /* 移動履歴 */

  /* ファイルを読み込む */
  load(text) {
    const obj = JSON.parse(text);
    for (const element of obj) {
      const begin = new Date(element.startTime);
      const end = new Date(element.endTime);
      /* 訪問場所 */
      if (element.visit !== undefined) {
        const lat_lng = element.visit.topCandidate.placeLocation.replace('geo:', '').split(',');
        this.__visits.push({
          time: {
            begin: begin,
            end: end,
          },
          point: {
            latitude: lat_lng[0],
            longitude: lat_lng[1],
          },
        });
      }
      /* 移動履歴 */
      else if (element.timelinePath != undefined) {
        let activity = {
          time: {
            begin: begin,
            end: end,
          },
          points: [],
        };
        for (const path of element.timelinePath) {
          let lat_lng = path.point.replace('geo:', '').split(',');
          activity.points.push({
            latitude: lat_lng[0],
            longitude: lat_lng[1],
          });
        }
        this.__activities.push(activity);
      }
      /* 移動履歴(old style) */
      else if (element.activity !== undefined) {
        let activity = {
          time: {
            begin: begin,
            end: end,
          },
          points: [],
        };
        let lat_lng;
        lat_lng = element.activity.start.replace('geo:', '').split(',');
        activity.points.push({
            latitude: lat_lng[0],
            longitude: lat_lng[1],
        });
        lat_lng = element.activity.end.replace('geo:', '').split(',');
        activity.points.push({
            latitude: lat_lng[0],
            longitude: lat_lng[1],
        });
        this.__activities.push(activity);
      }
    }
  };

  /* 値を取得するときのフィルター */
  __get_filter(begin, end, arr) {
    let rtn = [];
    for (const value of arr) {
      if (value.time.begin < begin || value.time.end > end) {
        continue;
      }
      rtn.push(value);
    }
    return rtn;
  };

  /* 訪問場所を取得する */
  getVisits(begin, end) {
    return this.__get_filter(begin, end, this.__visits);
  };

  /* 移動履歴を取得する */
  getActivities(begin, end) {
    return this.__get_filter(begin, end, this.__activities);
  };
}

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      LocationHisrtoryJson,
    }
  }
});
