import { default as AdapterDateFns } from '@date-io/date-fns';
//import { DateIOFormats } from "@date-io/core/IUtils";
import { format as formatBase, toDate as toDateBase } from 'date-fns';

export const CurrentDateAndTzDateFnsUtils = (now: Date | number) =>
  class DateFnsTzUtils extends AdapterDateFns {
    // public format = (date: Date, formatKey: keyof DateIOFormats) => {
    //   return this.formatByString(date, this.formats[formatKey]);
    // };
    // public formatByString = (date: Date, format: string) => {
    //   return formatBase(date, format);
    // };
    public date = (value?: any) => {
      if (typeof value === "undefined" || value === null) {
        return toDateBase(now);
      }
      return new Date(value);
    };

  }