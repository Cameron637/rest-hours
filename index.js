'use strict';

/**
 * Marks the input as invalid and displays a help message.
 * @param {HTMLElement} input The input element.
 */
const displayInvalid = (input) => {
  input.classList.add('error');
  input.nextElementSibling.classList.remove('hidden');
};

/**
 * Marks the input as correct and hides the help message.
 * @param {HTMLElement} input The input element.
 */
const hideInvalid = (input) => {
  input.classList.remove('error');
  input.nextElementSibling.classList.add('hidden');
};

/**
 * Hides or displays input errors depending on
 * whether the given date and time are valid.
 * 
 * @param {Moment} date The input date.
 * @param {Moment} time The input time.
 * 
 * @returns {Boolean} True if input is valid, false otherwise.
 */
const checkInput = (date, time) => {
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const invalidDate = !date.isValid();
  const invalidTime = !time.isValid();

  if (invalidDate && invalidTime) {
    displayInvalid(dateInput);
    displayInvalid(timeInput);
    return false;
  } else if (invalidDate) {
    displayInvalid(dateInput);
    hideInvalid(timeInput);
    return false;
  } else if (invalidTime) {
    hideInvalid(dateInput);
    displayInvalid(timeInput);
    return false;
  }

  hideInvalid(dateInput);
  hideInvalid(timeInput);
  return true;
};

/**
 * Removes the contents of the given element.
 * @param {HTMLElement} element The element to be cleared.
 */
const clear = (element) => {
  element.innerHTML = '';
};

/**
 * Inserts the HTML represented by the given string
 * before the end of the given element.
 * 
 * @param {HTMLElement} element The element to modify.
 * @param {String} html The HTML string to insert.
 */
const insertBeforeEnd = (element, html) => {
  element.insertAdjacentHTML('beforeend', html);
};

/**
 * If the given output is an array of restaurants,
 * inserts the name of each restaurant or a "No results."
 * message into the results list.
 * 
 * Else if the given output is an error string,
 * inserts the message in place of the body of the page.
 * 
 * @param {Array<Object>|String} output The output to display.
 */
const display = (output) => {
  if (Array.isArray(output)) {
    const list = document.querySelector('ul');
    clear(list);

    if (output.length) {
      output.forEach(rest => insertBeforeEnd(list, `<li>${rest.name}`));
    } else {
      insertBeforeEnd(list, '<li> No results.');
    }
  } else {
    const main = document.querySelector('main');
    clear(main);
    insertBeforeEnd(main, output);
  }
};

/**
 * Iterates over an array of strings representing a restaurants schedule,
 * mapping it into a dictionary object with weekdays as keys and time-range
 * objects as values.
 * 
 * For example,
 * ("Sun 8 am - 10 pm") => ({
 *    Sun: {
 *      open: Moment("8 am"),
 *      close: Moment("10 pm")
 *    }
 * });
 * 
 * @param {Array<String>} times The string representations of
 *    the restauraunt's schedule.
 * @param {Array<String>} weekdays The days of the week, by short name.
 * @param {Object} matcher An object containing regex matchers for
 *    weekdays/times
 * @param {Array<String>} formats A list of formats for constructing
 *    Moment objects based on a given time.
 * 
 * @returns {Object} An dictionary object representing
 *    a restaurants schedule by day
 */
const makeSchedule = (times, weekdays, matcher, formats) => {
  const schedule = {};

  times.forEach(time => {
    const dayRange = matcher.dayRange.exec(time);
    const loneDay = matcher.loneDay.exec(time);
    const timeRange = matcher.timeRange.exec(time);
    const [open, close] = timeRange[0].split(' - ');

    const dayTimes = {
      open: moment(open, formats),
      close: moment(close, formats)
    };

    if (dayTimes.close.isSameOrBefore(dayTimes.open)) {
      dayTimes.close.add(1, 'day');
    }

    if (dayRange) {
      const [start, end] = dayRange[0].split('-');
      const indexOfStart = weekdays.indexOf(start);
      const indexOfEnd = weekdays.indexOf(end);
      let daysInRange;

      if (indexOfStart > indexOfEnd) {
        daysInRange = weekdays.slice(indexOfStart);
        daysInRange = daysInRange.concat(weekdays.slice(0, indexOfEnd + 1));
      } else {
        daysInRange = weekdays.slice(indexOfStart, indexOfEnd + 1);
      }

      daysInRange.forEach(day => {
        schedule[day] = dayTimes;
      });
    }

    if (loneDay) {
      schedule[loneDay[0].trim()] = dayTimes;
    }
  });

  return schedule;
};

/**
 * Gets a list of restaurants from a local json file
 * and maps them into usable JavaScript objects with
 * robust, easy-access schedules.
 * 
 * @returns {Array<Object>} An array of restaurant objects.
 */
const getRestaurants = async () => {
  const res = await fetch('rest_hours.json');
  const json = await res.json();
  const weekdays = moment.weekdaysShort();
  const timeMatcher = '[0-9]{1,2}:{0,1}[0-9]{0,2} (am|pm)';
  const formats = ['h:mm a', 'h: a'];

  const matcher = {
    dayRange: /([A-Z])\w+-([A-Z])\w+/,
    loneDay: /(^|\s)([A-Z])\w+\s/,
    timeRange: new RegExp(timeMatcher + ' - ' + timeMatcher)
  };

  const restaurants = json.map(restaurant => ({
    name: restaurant.name,
    schedule: makeSchedule(restaurant.times, weekdays, matcher, formats)
  }));

  return restaurants
};

/**
 * Checks if a restaurant is open during a given day and time.
 * 
 * @param {Object} restaurant A restaurant object with a name and schedule.
 * @param {String} day A string representing the given day of the week.
 * @param {Moment} time A Moment object representing the given time.
 * 
 * @returns {Boolean|Void} True if restaurant is open for the given day/time.
 */
const isOpen = (restaurant, day, time) => {
  const schedule = restaurant.schedule[day];

  if (schedule && time.isBetween(schedule.open, schedule.close)) {
    return true;
  }
};

/**
 * Displays an error message to the user
 * in the event that any unexpected error occurs.
 */
const handleError = () => {
  const msg = '<p>We\'re sorry! An unexpected error occurred.'
    + '<br />Please try again later.</p>';

  display(msg);
};

/**
 * When a user submits a date and time, searches for restaurants
 * open during that day of the week and time and displays the
 * names of those restaurants, or a "No results." message if none
 * are open at that time.
 * 
 * @param {Array<Object>} restaurants An array of restaurant objects.
 * @param {Event} event A DOM event object, specifically 'onsubmit'.
 * 
 * @returns {Boolean|Void} False if inputs are not valid.
 */
const handleSubmit = (restaurants, event) => {
  if (event) {
    event.preventDefault();
  }

  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const date = moment(dateInput.value, 'YYYY-MM-DD');
  const time = moment(timeInput.value, ['HH:mm', 'h:mm a']);

  if (!checkInput(date, time)) {
    return false;
  }

  const day = date.format('ddd');
  const matches = restaurants.filter(rest => isOpen(rest, day, time));
  display(matches);
};

/**
 * Pre-populates the inputs and results list with the current date and time
 * and the restaurants that are currently open, respectively.
 * 
 * If date or time inputs are not supported in the user's browser,
 * display a format help label to the user.
 * 
 * @param {Array<Object>} restaurants An array of restaurant objects.
 */
const setupDefault = (restaurants) => {
  const date = document.getElementById('date');
  const time = document.getElementById('time');

  if (date.type === 'text') {
    document.querySelector('label[for="date"] .help').classList.remove('help');
  }

  if (time.type === 'text') {
    document.querySelector('label[for="time"] .help').classList.remove('help');
  }

  const now = moment();
  const nowDate = now.format('YYYY-MM-DD');
  date.min = nowDate;
  date.value = nowDate;
  time.value = now.format('HH:mm');
  handleSubmit(restaurants);
};

/**
 * The main function, wrapped to be async/await compatible.
 * Initializes the list of restaurants and the UI, and adds
 * an event listener to the input form.
 * 
 * Sends any errors to the "handleError" function.
 */
(async () => {
  const restaurants = await getRestaurants();
  setupDefault(restaurants);
  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => handleSubmit(restaurants, event));
})().catch(handleError);