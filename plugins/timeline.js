/*
 * タイムラインを管理する基底クラス
 */

export class TimeLine {
  __visits = []; /* 訪問場所 */
  __activities = []; /* 移動履歴 */

  /* 訪問場所を追加する */
  addVisit(begin, end, latitude, longitude) {
    this.__visits.push({
      time: {
        begin: begin,
        end: end,
      },
      point: {
        latitude: latitude,
        longitude: longitude,
      },
    });
  };

  /* 移動履歴を追加する */
  addActivity(begin, end, points) {
    this.__activities.push({
      time: {
        begin: begin,
        end: end,
      },
      points: points,
    });
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
      TimeLine,
    }
  }
});
