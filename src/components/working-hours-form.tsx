"use client";

import * as Switch from "@radix-ui/react-switch";
import { Clock3 } from "lucide-react";
import { useState } from "react";
import { dayNames, type WorkingHours } from "@/domain/salon/working-hours";

type FormAction = (form: FormData) => void | Promise<void>;

export function WorkingHoursForm({ value, action }: { value: WorkingHours; action: FormAction }) {
  const [closed, setClosed] = useState(() => Object.fromEntries(dayNames.map((_, day) => [day, value[String(day)].closed])));

  return <form action={action} className="hours-form">
    <div className="hours-intro"><span className="hours-intro-icon"><Clock3 aria-hidden="true"/></span><p>These are the normal booking hours. Closed days cannot be booked.</p></div>
    <div className="hours-list">
      {dayNames.map((name, day) => {
        const isClosed = closed[day];
        return <div className={`hours-row ${isClosed ? "is-closed" : ""}`} key={name}>
          <div className="hours-day"><strong>{name}</strong><span>{isClosed ? "Closed" : "Open for bookings"}</span></div>
          <label className="hours-switch"><span>Open</span><Switch.Root checked={!isClosed} onCheckedChange={(open) => setClosed((current) => ({ ...current, [day]: !open }))} aria-label={`${name} is open`}><Switch.Thumb/></Switch.Root><input type="hidden" name={`hours_${day}_closed`} value={isClosed ? "on" : ""}/></label>
          <div className="hours-time">
            {isClosed && <><input type="hidden" name={`hours_${day}_open`} value={value[String(day)].open}/><input type="hidden" name={`hours_${day}_close`} value={value[String(day)].close}/></>}
            <input aria-label={`${name} opening time`} type="time" name={`hours_${day}_open`} defaultValue={value[String(day)].open} disabled={isClosed} required/>
            <span aria-hidden="true">to</span>
            <input aria-label={`${name} closing time`} type="time" name={`hours_${day}_close`} defaultValue={value[String(day)].close} disabled={isClosed} required/>
          </div>
        </div>;
      })}
    </div>
    <button className="btn" type="submit">Save working hours</button>
  </form>;
}
