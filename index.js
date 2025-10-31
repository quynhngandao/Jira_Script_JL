"use strict";
const fs = require("fs/promises");
const { parse } = require("csv-parse/sync");

/**
 * CSV Ingestion Script
 * Reads jira.csv and converts it to standardized JSON format
 */
const ingestCSV = async () => {
  try {
    const csvContent = await fs.readFile("jira.csv", "utf-8");
    const records = parse(csvContent, {
      columns: true, // Use first line as column names
      skip_empty_lines: true,
      trim: true,
    });
    return records; // Returns array of objects with keys from CSV headers
  } catch (error) {
    throw new Error(`Error ingesting CSV: ${error.message}`);
  }
};

const main = async () => {
  const records = await ingestCSV();
  // console.log(records);
  const storyPointRecords = records.filter(
    (record) => record["Custom field (Story Points)"]
  );

  const recordsWithSalientFields = storyPointRecords.map((record) => {
    return {
      assignee: record["Assignee"],
      storyPoints: record["Custom field (Story Points)"],
    };
  });

  // console.log(recordsWithSalientFields);
  //create Map from assignee to total Story points over 12 week period
  const assignees = recordsWithSalientFields.reduce((acc, record) => {
    if (!acc[record.assignee]) {
      acc[record.assignee] = true;
    }
    return acc;
  }, {});

  // produce a map for each assignee
  const assigneesToJiras = Object.entries(assignees).map(([assignee, _]) => {
    return [
      assignee,
      recordsWithSalientFields
        .filter((record) => record.assignee === assignee)
        .reduce((acc, record) => acc + parseInt(record.storyPoints, 10), 0),
    ];
  });

  console.log(assigneesToJiras.sort((a, b) => b[1] - a[1]));
  return;
};

main();