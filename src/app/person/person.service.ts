import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor() { }

  add(person: any) {
    const people = JSON.parse(localStorage.getItem('people') as any) || [];
    people.push(person);
    localStorage.setItem('people', JSON.stringify(people));
  }

  edit(person: any) {
    let people = JSON.parse(localStorage.getItem('people') as any);

    for (let index = 0; index < people.length; index++) {
      if (person.id === people[index].id) {
        people[index] = person;
        localStorage.setItem('people', JSON.stringify(people));
      }
    }
  }

  delete(person: any) {
    let people = JSON.parse(localStorage.getItem('people') as any);
    const filteredProducts = people.filter((p: any) => p.id !== person.id);
    localStorage.setItem('people', JSON.stringify(filteredProducts));
  }

  findAll() {
    if (!JSON.parse(localStorage.getItem('people') as any)) {
      this.add({
        document: "1111111111",
        id: 1667216578878,
        name: "Julia Batista",
        phone: "92999999999",
      });
    }

    return (
      JSON.parse(localStorage.getItem('people') as any) || []
    );
  }
}
