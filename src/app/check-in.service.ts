import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CheckInService {
  constructor() {}

  add(checkIn: any) {
    const checkIns = JSON.parse(localStorage.getItem('check-ins') as any) || [];
    checkIns.push(checkIn);
    localStorage.setItem('check-ins', JSON.stringify(checkIns));
  }

  edit(checkIn: any) {
    let checkIns = JSON.parse(localStorage.getItem('check-ins') as any);

    for (let index = 0; index < checkIns.length; index++) {
      if (checkIn.id === checkIns[index].id) {
        checkIns[index] = checkIn;
        localStorage.setItem('check-ins', JSON.stringify(checkIns));
      }
    }
  }

  delete(checkIn: any) {
    let checkIns = JSON.parse(localStorage.getItem('check-ins') as any);
    const filteredProducts = checkIns.filter((p: any) => p.id !== checkIn.id);
    localStorage.setItem('check-ins', JSON.stringify(filteredProducts));
  }

  findAll() {
    if (!JSON.parse(localStorage.getItem('check-ins') as any)) {
      this.add({
        additionalVehicle: false,
        done: false,
        endDate: '2022-10-31T11:51:42.578Z',
        id: 1667217102578,
        person: {
          document: '1111111111',
          id: 1667216578878,
          name: 'Julia Batista',
          phone: '92999999999',
        },
        startDate: '2022-10-31T11:51:00.000Z',
        total: 0,
      });
    }

    return (
      JSON.parse(localStorage.getItem('check-ins') as any) || []
    );
  }
}
