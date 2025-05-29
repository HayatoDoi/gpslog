/*
 * Google My Mapなどでインポートできるkmlファイルを管理する
 */

import { TimeLine } from './timeline';

class TimeLineKml extends TimeLine {
  __header = '<?xml version="1.0" encoding="UTF-8"?>';
  __kml;
  __upper_tag = [
    ['document', 'Document'],
    ['placemark', 'Placemark'],
    ['point', 'Point'],
    ['timespan', 'TimeSpan'],
    ['linestring', 'LineString'],
  ];

  __addPlace(name, latitude, longitude, begin, end) {
    let _doc = this.__kml.getElementsByTagName('document')[0];
      let _placemark = document.createElement('placemark');
        let _name = document.createElement('name');
        _name.innerText = name;
        _placemark.appendChild(_name);
        let _point = document.createElement('point');
          let _coordinates = document.createElement('coordinates');
          _coordinates.innerText = `${longitude},${latitude},0`;
          _point.appendChild(_coordinates);
        _placemark.appendChild(_point);
        let _timespan = document.createElement('timespan');
          let _begin = document.createElement('begin');
          _begin.innerText = begin.toISOString();
          _timespan.appendChild(_begin);
          let _end = document.createElement('end');
          _end.innerText = end.toISOString();
          _timespan.appendChild(_end);
        _placemark.appendChild(_timespan);
    _doc.appendChild(_placemark);
  };

  __addLines(name, points, begin, end) {
    let _doc = this.__kml.getElementsByTagName('document')[0];
      let _placemark = document.createElement('placemark');
        let _name = document.createElement('name');
        _name.innerText = name;
        _placemark.appendChild(_name);
        let _linestring = document.createElement('linestring');
          let _coordinates = document.createElement('coordinates');
          for (const point of points) {
            _coordinates.innerText += ` ${point.longitude},${point.latitude},0`;
          }
          _linestring.appendChild(_coordinates);
        _placemark.appendChild(_linestring);
        let _timespan = document.createElement('timespan');
          let _begin = document.createElement('begin');
          _begin.innerText = begin.toISOString();
          _timespan.appendChild(_begin);
          let _end = document.createElement('end');
          _end.innerText = end.toISOString();
          _timespan.appendChild(_end);
        _placemark.appendChild(_timespan);
    _doc.appendChild(_placemark);
  };

  toString(begin, end) {
    this.__kml = document.createElement('kml');
    this.__kml.setAttribute('xmlns', 'http://www.opengis.net/kml/2.2');
    this.__kml.setAttribute('xmlns:gx', 'http://www.google.com/kml/ext/2.2');
    let _doc = document.createElement('document');
    this.__kml.appendChild(_doc);
    const visits = this.getVisits(begin, end);
    for (const visit of visits) {
      this.__addPlace(
        '',
        visit.point.latitude,
        visit.point.longitude,
        visit.time.begin,
        visit.time.end);
    }
    const activities = this.getActivities(begin, end);
    for (const activity of activities) {
      this.__addLines(
        '',
        activity.points,
        activity.time.begin,
        activity.time.end);
    }
    let text = new XMLSerializer().serializeToString(this.__kml).replace(/\sxmlns="[^"]+"/, '');
    this.__upper_tag.forEach((value) => {
      text = text.replaceAll(`<${value[0]}>`, `<${value[1]}>`);
      text = text.replaceAll(`</${value[0]}>`, `</${value[1]}>`);
    });
    return this.__header + '\n' + text;
  };
}

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      TimeLineKml,
    }
  }
});
