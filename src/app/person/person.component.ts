import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { MessageService } from '../message.service';
import { PersonService } from './person.service';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements OnInit {
  title: string = 'Cadastrar nova pessoa';

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['name', 'document', 'phone', 'actions'];

  personForm = this.fb.group({
    id: [''],
    document: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.minLength(11)]],
  });

  editModeActiveted: boolean = false;
  currentIndex: any = 0;
  loading: boolean = false;
  isLoading: boolean = true;

  dialogRefResult: boolean = false;

  @ViewChild('paginator', { static: false }) paginator!: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<PersonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private messageService: MessageService,
    private dialog: MatDialog,
    private personService: PersonService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    setTimeout(() => {
      this.isLoading = false;
      const people = this.personService.findAll();
      this.dataSource = new MatTableDataSource(people.reverse());
      this.dataSource.paginator = this.paginator;
    }, 1000);
  }

  savePerson() {
    this.loading = true;

    let personObject: any = {
      id: this.personForm.controls['id'].value,
      document: this.personForm.controls['document'].value,
      name: this.personForm.controls['name'].value,
      phone: this.personForm.controls['phone'].value,
    };

    if (this.editModeActiveted) {
      this.disabledForm();
      setTimeout(() => {
        this.dataSource.data.splice(this.currentIndex, 1, personObject);
        this.personService.edit(personObject);
        this.messageService.send('Pessoa alterada.');
        this.resetFields();
        this.enableForm();
      }, 2000);
    } else {
      setTimeout(() => {
        personObject.id = Date.now();
        this.personService.add(personObject);
        this.messageService.send('Pessoa salva.');
        this.load();
        this.resetFields();
      }, 2000);
    }

    this.dialogRefResult = true;
  }

  resetFields() {
    this.editModeActiveted = false;
    this.loading = false;
    this.dataSource.filter = '';
    this.personForm.reset();
    this.title = 'Cadastrar nova pessoa';
  }

  removeAt(index: number) {
    const data = this.dataSource.data;
    data.splice(index, 1);

    this.dataSource.data = data;
    this.personForm.patchValue({
      document: '',
      name: '',
      phone: '',
    });
  }

  editAt(index: any, person: any) {
    this.title = 'Alterar pessoa';
    this.currentIndex = index;

    this.editModeActiveted = true;
    this.personForm.patchValue({
      id: person.id,
      document: person.document,
      name: person.name,
      phone: person.phone,
    });
  }

  cancelEdition() {
    this.title = 'Cadastrar nova pessoa';
    this.personForm.reset();
    this.editModeActiveted = false;
  }

  deletePerson(index: any, person: any) {
    this.dialogRefResult = true;
    this.removeAt(index);
    this.personService.delete(person);
    this.messageService.send('Pessoa excluída.');
    this.load();
  }

  openConfirmDialog(index: any, person: any) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      maxWidth: '400px',
    });
    dialogRef.afterClosed().subscribe((dialogResult) => {
      if (dialogResult) this.deletePerson(index, person);
    });
  }

  sortData(sort: Sort) {
    if (sort.active && sort.direction !== '') {
      this.dataSource.data = this.dataSource.data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return this.compare(a, b, isAsc);
          default:
            return 0;
        }
      });
    }
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  disabledForm() {
    this.personForm.controls['name'].disable();
    this.personForm.controls['document'].disable();
    this.personForm.controls['phone'].disable();
  }

  enableForm() {
    this.personForm.controls['name'].enable();
    this.personForm.controls['document'].enable();
    this.personForm.controls['phone'].enable();
  }
}
