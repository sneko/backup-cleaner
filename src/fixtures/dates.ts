import { parseISO } from 'date-fns';

export const datesBeforeClean = [
  parseISO('2024-01-12'),
  parseISO('2024-01-11T14:34:32.999Z'), // To distinguish from the next one when using the timestamp to create the file
  parseISO('2024-01-11'),
  parseISO('2024-01-10'),
  parseISO('2024-01-09'),
  parseISO('2024-01-08'),
  parseISO('2024-01-07'),
  parseISO('2024-01-06'),
  parseISO('2024-01-05'),
  parseISO('2024-01-04'),
  parseISO('2023-12-30'),
  parseISO('2023-12-29'),
  parseISO('2023-12-20'),
  parseISO('2023-12-19'),
  parseISO('2023-12-03'),
  parseISO('2023-12-02'),
  parseISO('2023-12-01'),
  parseISO('2023-11-26'),
  parseISO('2023-11-01'),
  parseISO('2023-10-26'),
  parseISO('2023-09-11'),
  parseISO('2023-09-10'),
  parseISO('2023-02-01'),
  parseISO('2023-01-01'),
  parseISO('2022-12-01'),
  parseISO('2022-11-01'),
  parseISO('2021-11-01'),
  parseISO('2021-01-01'),
  parseISO('2020-01-01'),
];

export const datesDeletedAfterClean = [
  parseISO('2020-01-01'),
  parseISO('2021-01-01'),
  parseISO('2021-11-01'),
  parseISO('2022-12-01'),
  parseISO('2023-09-11'),
  parseISO('2023-11-26'),
  parseISO('2023-12-02'),
  parseISO('2023-12-03'),
  parseISO('2023-12-20'),
  parseISO('2023-12-30'),
  parseISO('2024-01-05'),
  parseISO('2024-01-11T14:34:32.999Z'),
];
