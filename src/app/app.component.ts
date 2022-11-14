import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, ReplaySubject, takeUntil, take } from 'rxjs';
import { CheckInService } from './check-in.service';
import { MessageService } from './message.service';
import { PersonComponent } from './person/person.component';
import { PersonService } from './person/person.service';
import * as moment from 'moment';
import { DailyRates } from './enums/daily-rates';
import { formatDate } from '@angular/common';
import { CheckInStatus } from './enums/check-in-status';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['name', 'document', 'value', 'actions'];

  searchForm = this.fb.group({
    id: [''],
    startDate: [
      formatDate(new Date(), 'yyyy-MM-ddThh:mm', 'pt'),
      [Validators.required],
    ],
    endDate: [formatDate(new Date(), 'yyyy-MM-ddThh:mm', 'pt')],
    person: ['', [Validators.required]],
    additionalVehicle: [false],
    total: [0],
    done: [false],
  });

  title: string = 'Novo Check-in';

  checkInModeActiveted: boolean = false;

  currentIndex: any = 0;

  loading: boolean = false;
  isLoading: boolean = true;

  people: any[] = [];

  protected _onDestroy = new Subject<void>();

  public checkInFilterCtrl: FormControl = new FormControl();
  public filteredCheckIns: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;
  @ViewChild('paginator', { static: false }) paginator!: MatPaginator;

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private personService: PersonService,
    private checkInService: CheckInService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.load();
      this.loadPeople();
      this.loadDailyPrice();

      this.loadFilters();
    }, 1000);
  }

  loadFilters() {
    this.filteredCheckIns.next(this.people.slice());
    this.checkInFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterCheckIns();
      });
  }

  ngAfterViewInit() {
    this.setInitialValue();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setInitialValue() {
    this.filteredCheckIns
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        this.singleSelect.compareWith = (a: any, b: any) =>
          a && b && a.id === b.id;
      });
  }

  filterCheckIns() {
    if (!this.people) {
      return;
    }

    let search = this.checkInFilterCtrl.value;
    if (!search) {
      this.filteredCheckIns.next(this.people.slice());
      return;
    } else {
      search = search.toLowerCase();
    }

    this.filteredCheckIns.next(
      this.people.filter(
        (checkIn) =>
          checkIn.name.toLowerCase().indexOf(search) > -1 ||
          checkIn.document.indexOf(search) > -1
      )
    );
  }

  load(filter?: CheckInStatus) {
    this.isLoading = false;
    let checkIns = this.checkInService.findAll();

    switch (filter) {
      case CheckInStatus.HAS_DONE_CHECK_IN:
        checkIns = checkIns.filter((c: any) => c.done);
        break;
      case CheckInStatus.NOT_HAS_DONE_CHECK_IN:
        checkIns = checkIns.filter((c: any) => !c.done);
        break;
      default:
        checkIns = this.checkInService.findAll();
        break;
    }

    this.dataSource = new MatTableDataSource(checkIns.reverse());
    this.dataSource.paginator = this.paginator;
  }

  loadPeople() {
    this.people = this.personService.findAll();
  }

  goToPerson() {
    this.dialog
      .open(PersonComponent, {
        width: '50%',
        maxWidth: '100vw !important',
        data: '',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loadPeople();
          this.loadFilters();
        }
      });
  }

  save() {
    this.loading = true;

    let checkInObject: any = {
      startDate: this.searchForm.controls['startDate'].value,
      person: this.searchForm.controls['person'].value,
      additionalVehicle: this.searchForm.controls['additionalVehicle'].value,
    };

    const from = moment(checkInObject.startDate).format(
      'YYYY-MM-DD'
    );
    const to = moment(checkInObject.endDate).format(
      'YYYY-MM-DD'
    );

    if (!moment(from).isSame(to, 'day')) {
      checkInObject.endDate = this.searchForm.controls['endDate'].value;
    }

    if (this.checkInModeActiveted) {
      setTimeout(() => {
        checkInObject.id = this.searchForm.controls['id'].value;
        checkInObject.done = true;
        checkInObject.total = this.getCalcTotal(
          checkInObject.additionalVehicle
        );
        this.checkInService.edit(checkInObject);
        this.messageService.send('Check-in efetuado com sucesso.');
        this.load();
        this.resetFields();
      }, 2000);
    } else {
      setTimeout(() => {
        checkInObject.id = Date.now();
        checkInObject.done = false;
        checkInObject.total = 0;
        checkInObject.startDate = new Date(
          checkInObject.startDate
        ).toISOString();
        if (checkInObject.endDate)
          checkInObject.endDate = new Date(checkInObject.endDate).toISOString();
        else checkInObject.endDate = new Date().toISOString();

        checkInObject.id = Date.now();
        this.checkInService.add(checkInObject);
        this.messageService.send('Entrada de hospede salva.');
        this.load();
        this.resetFields();
      }, 2000);
    }
  }

  loadCheckIn(index: any, checkIn: any) {
    this.checkInModeActiveted = true;
    this.title = `Hóspede: ${checkIn.person.name} | Documento: ${checkIn.id}`;
    this.currentIndex = index;

    this.searchForm.patchValue({
      id: checkIn.id,
      startDate: formatDate(checkIn.startDate, 'yyyy-MM-ddThh:mm', 'pt-BR'),
      endDate: checkIn.endDate
        ? formatDate(checkIn.endDate, 'yyyy-MM-ddThh:mm', 'pt-BR')
        : '',
      person: checkIn.person,
      additionalVehicle: checkIn.additionalVehicle,
      done: checkIn.done,
    });

    this.onAddValidationEndDate();

    if (checkIn.done) this.disabledForm();
    else this.enableForm();

    const total = this.getCalcTotal(
      this.searchForm.controls['additionalVehicle'].value as boolean
    );
    this.searchForm.controls['total'].setValue(total);
  }

  refreshTotal(checked: any) {
    const total = this.getCalcTotal(checked);
    this.searchForm.controls['total'].setValue(total);
  }

  resetFields() {
    this.loading = false;
    this.searchForm.reset();
    this.dataSource.filter = '';
    this.title = 'Novo Check-in';
    this.checkInModeActiveted = false;
    this.searchForm.controls['total'].setValue(0);
  }

  cancelEdition() {
    this.title = 'Novo Check-in';
    this.searchForm.reset();
    this.checkInModeActiveted = false;
    this.enableForm();
    this.onRemoveValidationEndDate();
    this.searchForm.controls['total'].setValue(0);
  }

  sortData(sort: Sort) {
    if (sort.active && sort.direction !== '') {
      this.dataSource.data = this.dataSource.data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return this.compare(a.name, b.name, isAsc);
          default:
            return 0;
        }
      });
    }
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  clearSearchFilter() {
    setTimeout(() => {
      this.checkInFilterCtrl.setValue('');
    }, 500);
  }

  loadDailyPrice() {
    const todayDateWeekday = moment(new Date()).weekday();
    const price = this.isWeekend(todayDateWeekday)
      ? DailyRates.DAILY_WEEKEND
      : DailyRates.DAILY_OF_THE_WEEK;
    this.searchForm.controls['total'].setValue(price);
  }

  getDailyPrice() {
    const todayDateWeekday = moment(new Date()).weekday();
    return this.isWeekend(todayDateWeekday)
      ? DailyRates.DAILY_WEEKEND
      : DailyRates.DAILY_OF_THE_WEEK;
  }

  getCalcTotal(additionalVehicle: boolean) {
    let total = 0;

    const endDate = moment(this.searchForm.controls['endDate'].value);
    const endDateWeekday = moment(
      endDate.isValid() ? this.searchForm.controls['endDate'].value : new Date()
    ).weekday();

    const from = moment(this.searchForm.controls['startDate'].value).format(
      'YYYY-MM-DD'
    );
    const to = moment(this.searchForm.controls['endDate'].value).format(
      'YYYY-MM-DD'
    );

    const rangeDaysOfTheWeek = this.getRange(from, to, 'days').map((day) =>
      day.weekday()
    );
    rangeDaysOfTheWeek.push(endDateWeekday);

    for (let dayOfTheWeek of rangeDaysOfTheWeek) {
      if (!this.isWeekend(dayOfTheWeek)) {
        total += 120;
        if (additionalVehicle) total += 15;
      }

      if (this.isWeekend(dayOfTheWeek)) {
        total += 150;
        if (additionalVehicle) total += 20;
      }
    }

    const limitTime = moment([
      endDate.year(),
      endDate.month(),
      endDate.date(),
      16,
      30,
      0,
      0,
    ]);

    if (endDate.isAfter(limitTime))
      total += this.isWeekend(endDateWeekday)
        ? DailyRates.DAILY_WEEKEND
        : DailyRates.DAILY_OF_THE_WEEK;

    return total;
  }

  isWeekend(dayOfTheWeek: number): boolean {
    return dayOfTheWeek === 6 || dayOfTheWeek === 0;
  }

  /**
   * @param {date|moment} start The start date
   * @param {date|moment} end The end date
   * @param {string} type The range type. eg: 'days', 'hours' etc
   */
  getRange(startDate: any, endDate: any, type: any) {
    let fromDate = moment(startDate);
    let toDate = moment(endDate);
    let diff = toDate.diff(fromDate, type);
    let range = [];
    for (let i = 0; i < diff; i++) {
      range.push(moment(startDate).add(i, type));
    }
    return range;
  }

  radioChange(event: any) {
    switch (event.value) {
      case '1':
        this.load(CheckInStatus.NOT_HAS_DONE_CHECK_IN);
        break;
      case '2':
        this.load(CheckInStatus.HAS_DONE_CHECK_IN);
        break;
      default:
        this.load(CheckInStatus.ALL_CHECK_IN);
        break;
    }
  }

  disabledForm() {
    this.searchForm.controls['startDate'].disable();
    this.searchForm.controls['endDate'].disable();
    this.searchForm.controls['person'].disable();
    this.searchForm.controls['additionalVehicle'].disable();
    this.searchForm.controls['endDate'].updateValueAndValidity();
  }

  enableForm() {
    this.searchForm.controls['startDate'].enable();
    this.searchForm.controls['endDate'].enable();
    this.searchForm.controls['person'].enable();
    this.searchForm.controls['additionalVehicle'].enable();
    this.searchForm.controls['endDate'].updateValueAndValidity();
  }

  onAddValidationEndDate() {
    this.searchForm.controls['endDate'].setValidators(Validators.required);
    this.searchForm.controls['endDate'].updateValueAndValidity();
  }

  onRemoveValidationEndDate() {
    this.searchForm.controls['endDate'].clearValidators();
    this.searchForm.controls['endDate'].updateValueAndValidity();
  }
}
