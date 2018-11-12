webpackJsonp([20],{

/***/ 268:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var $ = __webpack_require__(0);

var maps = __webpack_require__(124);
var events = __webpack_require__(14);

function highlightRowAndState($map, $table, state, scroll) {
  var $scrollBody = $table.closest('.dataTables_scrollBody');
  var $row = $scrollBody.find('span[data-state="' + state + '"]');

  if ($row.length > 0) {
    maps.highlightState($('.state-map'), state);
    $scrollBody.find('.row-active').removeClass('row-active');
    $row.parents('tr').addClass('row-active');
    if (scroll) {
      $scrollBody.animate({
        scrollTop: $row.closest('tr').height() * parseInt($row.attr('data-row'))
      }, 500);
    }
  }
}

function init($map, $table) {
  $map.on('click', 'path[data-state]', function() {
    var state = $(this).attr('data-state');
    events.emit('state.map', {state: state});
  });

  $table.on('click', 'tr', function() {
    events.emit('state.table', {
      state: $(this).find('span[data-state]').attr('data-state')
    });
  });

  events.on('state.table', function(params) {
    highlightRowAndState($map, $('.data-table'), params.state, false);
  });

  events.on('state.map', function(params) {
    var $map = $('.state-map');
    highlightRowAndState($map, $table, params.state, true);
  });
}

module.exports = {
  highlightRowAndState: highlightRowAndState,
  init: init
};


/***/ }),

/***/ 339:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* global require, document, context, WEBMANAGER_EMAIL */

var $ = __webpack_require__(0);
var URI = __webpack_require__(8);

var maps = __webpack_require__(124);
var mapsEvent = __webpack_require__(268);
var tables = __webpack_require__(13);
var helpers = __webpack_require__(6);
var columnHelpers = __webpack_require__(60);
var columns = __webpack_require__(18);
var events = __webpack_require__(14);
var OtherSpendingTotals = __webpack_require__(340);

var aggregateCallbacks = {
  afterRender: tables.barsAfterRender.bind(undefined, undefined),
};

// DOM element and URL for building the state map
var $map = $('.state-map');
var mapUrl = helpers.buildUrl(
  ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
  {
    candidate_id: $map.data('candidate-id'),
    cycle: $map.data('cycle'),
    per_page: 99
  }
);

var expenditureColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['independent-expenditures'], function(data, type, row) {
      return {
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id,
      };
    })
  },
  columns.committeeColumn({
    data: 'committee',
    className: 'all'
  }),
  columns.supportOpposeColumn
];

var communicationCostColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['communication-costs'], function(data, type, row) {
      return {
        support_oppose_indicator: row.support_oppose_indicator,
        candidate_id: row.candidate_id,
      };
    })
  },
  columns.committeeColumn({
    data: 'committee',
    className: 'all'
  }),
  columns.supportOpposeColumn
];

var electioneeringColumns = [
  {
    data: 'total',
    className: 'all',
    orderable: true,
    orderSequence: ['desc', 'asc'],
    render: columnHelpers.buildTotalLink(['electioneering-communications'],
      function(data, type, row) {
        return {
          candidate_id: row.candidate_id
        };
      })
  },
  columns.committeeColumn({
    data: 'committee',
    className: 'all'
  })
];

var otherDocumentsColumns = [
  columnHelpers.urlColumn('pdf_url', {
    data: 'document_description',
    className: 'all column--medium',
    orderable: false
  }),
  {
    data: 'most_recent',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      var version = helpers.amendmentVersion(data);
      if (version === 'Version unknown') {
        return '<i class="icon-blank"></i>Version unknown<br>' +
          '<i class="icon-blank"></i>' + row.fec_file_id;
      } else {
        if (row.fec_file_id !== null) {
          version = version + '<br><i class="icon-blank"></i>' + row.fec_file_id;
        }
        return version;
      }
    }
  },
  columns.dateColumn({
    data: 'receipt_date',
    className: 'min-tablet'
  })
];

var itemizedDisbursementColumns = [
  {
    data: 'committee_id',
    className: 'all',
    orderable: false,
    render: function(data, type, row) {
      return columnHelpers.buildEntityLink(
        row.committee.name,
        helpers.buildAppUrl(['committee', row.committee_id]),
        'committee'
      );
    }
  },
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false,
  },
  {
    data: 'recipient_state',
    className: 'min-tablet hide-panel',
    orderable: false,
  },
  {
    data: 'disbursement_description',
    className: 'all',
    orderable: false,
    defaultContent: 'NOT REPORTED'
  },
  columns.dateColumn({
    data: 'disbursement_date',
    className: 'min-tablet'
  }),
  columns.currencyColumn({
    data: 'disbursement_amount',
    className: 'column--number'
  }),
];

var individualContributionsColumns = [
  {
    data: 'contributor_name',
    className: 'all',
    orderable: false,
  },
  {
    data: 'committee',
    className: 'all',
    orderable: false,
    paginator: tables.SeekPaginator,
    render: function(data, type, row) {
      return columnHelpers.buildEntityLink(
        row.committee.name,
        helpers.buildAppUrl(['committee', row.committee_id]),
        'committee'
      );
    }
  },
  columns.dateColumn({
    data: 'contribution_receipt_date',
    className: 'min-tablet'
  }),
  columns.currencyColumn({
    data: 'contribution_receipt_amount',
    className: 'column--number'
  }),
];

// Begin datatable functions in order of tab appearance
// - Financial summary:
//   * Candidate filing years
// - About this candidate:
//   * Other documents filed
// - Spending by others to support/oppose:
//   * Independent expenditures,
//   * Communication costs,
//   * Electioneering communications
// - Itemized disbursements:
//   * Disbursements by transaction
// - Individual contributions:
//   * Contributor state, size, all transactions

function initOtherDocumentsTable() {
  var $table = $('table[data-type="other-documents"]');
  var candidateId = $table.data('candidate');
  var path = ['filings'];
  tables.DataTable.defer($table, {
    path: path,
    query: {
      candidate_id: candidateId,
      form_type: 'F99'
    },
    columns: otherDocumentsColumns,
    order: [[2, 'desc']],
    dom: tables.simpleDOM,
    pagingType: 'simple',
    lengthMenu: [10, 30, 50],
    hideEmpty: false
  });
}

var tableOpts = {
  'independent-expenditures': {
    path: ['schedules', 'schedule_e', 'by_candidate'],
    columns: expenditureColumns,
    title: 'independent expenditures'
  },
  'communication-costs': {
    path: ['communication_costs', 'by_candidate'],
    columns: communicationCostColumns,
    title: 'communication costs'
  },
  'electioneering': {
    path: ['electioneering', 'by_candidate'],
    columns: electioneeringColumns,
    title: 'electioneering communications'
  }
};

function initSpendingTables() {
  $('.data-table').each(function(index, table) {
    var $table = $(table);
    var dataType = $table.data('type');
    var opts = tableOpts[dataType];
    var query = {
      candidate_id: $table.data('candidate'),
      cycle: $table.data('cycle'),
      election_full: $table.data('election-full')
    };
    var displayCycle = helpers.formatCycleRange($table.data('cycle'), $table.data('duration'));
    if(displayCycle == null) {
      displayCycle = "unspecified cycle";
    }
    if (opts) {
      tables.DataTable.defer($table, {
        path: opts.path,
        query: query,
        columns: opts.columns,
        order: [[0, 'desc']],
        dom: tables.simpleDOM,
        pagingType: 'simple',
        lengthChange: true,
        pageLength: 10,
        lengthMenu: [10, 50, 100],
        hideEmpty: true,
        hideEmptyOpts: {
          dataType: opts.title,
          email: WEBMANAGER_EMAIL,
          name: context.name,
          timePeriod: displayCycle,
          reason: helpers.missingDataReason(dataType)
        }
      });
    }
  });
}

function initDisbursementsTable() {
  var $table = $('table[data-type="itemized-disbursements"]');
  var path = ['schedules', 'schedule_b'];
  var committeeIdData = $table.data('committee-id');
  var committeeIds = "";
  if(committeeIdData) {
    committeeIds = committeeIdData.split(',').filter(Boolean);
  }
  var opts = {
    // possibility of multiple committees, so split into array
    committee_id: committeeIds,
    title: 'itemized disbursements',
    name: $table.data('name'),
    cycle: $table.data('cycle')
  };
  var displayCycle = helpers.formatCycleRange($table.data('cycle'), $table.data('duration'));
  if(displayCycle == null) {
    displayCycle = "unspecified cycle";
  }
  tables.DataTable.defer($table, {
    path: path,
    query: {
      committee_id: opts.committee_id,
      two_year_transaction_period: opts.cycle
    },
    columns: itemizedDisbursementColumns,
    order: [[4, 'desc']],
    dom: tables.simpleDOM,
    paginator: tables.SeekPaginator,
    lengthMenu: [10, 50, 100],
    useFilters: true,
    useExport: true,
    singleEntityItemizedExport: true,
    hideEmpty: true,
    hideEmptyOpts: {
      email: WEBMANAGER_EMAIL,
      dataType: opts.title,
      name: opts.name,
      timePeriod: displayCycle,
      reason: helpers.missingDataReason('disbursements')
    }
  });
}

function initContributionsTables() {
  var $allTransactions = $('table[data-type="individual-contributions"]');
  var $contributionSize = $('table[data-type="contribution-size"]');
  var $contributorState = $('table[data-type="contributor-state"]');
  var displayCycle = helpers.formatCycleRange($allTransactions.data('cycle'), 2);
  var candidateName = $allTransactions.data('name');
  var committeeIdData = $allTransactions.data('committee-id');
  var committeeIds = "";
  if(committeeIdData) {
    committeeIds = committeeIdData.split(',').filter(Boolean);
  }
  var opts = {
    // possibility of multiple committees, so split into array
    // also, filter array to remove any blank values
    committee_id: committeeIds,
    candidate_id: $allTransactions.data('candidate-id'),
    title: 'individual contributions',
    name: candidateName,
    cycle: $allTransactions.data('cycle'),
  };

  var reason = helpers.missingDataReason('contributions');

  tables.DataTable.defer($allTransactions, {
    path: ['schedules', 'schedule_a'],
    query: {
      committee_id: opts.committee_id,
      is_individual: true,
      two_year_transaction_period: opts.cycle
    },
    columns: individualContributionsColumns,
    order: [[2, 'desc']],
    dom: tables.simpleDOM,
    paginator: tables.SeekPaginator,
    useFilters: true,
    useExport: true,
    singleEntityItemizedExport: true,
    hideEmpty: true,
    hideEmptyOpts: {
      dataType: 'individual contributions',
      email: WEBMANAGER_EMAIL,
      name: candidateName,
      timePeriod: displayCycle,
      reason: reason
    }
  });

  tables.DataTable.defer($contributorState, {
    path: ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    query: {
      candidate_id: opts.candidate_id,
      cycle: opts.cycle,
      sort_hide_null: false,
      per_page: 99
    },
    columns: [{
      data: 'state_full',
      width: '50%',
      className: 'all',
      render: function(data, type, row, meta) {
        var span = document.createElement('span');
        span.textContent = data;
        span.setAttribute('data-state', data);
        span.setAttribute('data-row', meta.row);
        return span.outerHTML;
      }
    },
      {
        data: 'total',
        width: '50%',
        className: 'all',
        orderSequence: ['desc', 'asc'],
        render: columnHelpers.buildTotalLink(['receipts', 'individual-contributions'],
          function(data, type, row) {
            return {
              contributor_state: row.state,
              committee_id: opts.committee_id
            };
          }
        )
      }],
    callbacks: aggregateCallbacks,
    dom: 't',
    order: [[1, 'desc']],
    paging: false,
    scrollY: 400,
    scrollCollapse: true
  });

  tables.DataTable.defer($contributionSize, {
    path: ['schedules', 'schedule_a', 'by_size', 'by_candidate'],
    query: {
      candidate_id: opts.candidate_id,
      cycle: opts.cycle,
      sort: 'size'
    },
    columns: [{
      data: 'size',
      width: '50%',
      className: 'all',
      orderable: false,
      render: function(data) {
        return columnHelpers.sizeInfo[data].label;
      }
    },
      {
        data: 'total',
        width: '50%',
        className: 'all',
        orderSequence: ['desc', 'asc'],
        orderable: false,
        render: columnHelpers.buildTotalLink(['receipts', 'individual-contributions'],
          function(data, type, row) {
            var params = columnHelpers.getSizeParams(row.size);
            params.committee_id = opts.committee_id;
            return params;
          }
        )
      }],
    callbacks: aggregateCallbacks,
    dom: 't',
    order: false,
    pagingType: 'simple',
    lengthChange: false,
    pageLength: 10,
    hideEmpty: true,
    hideEmptyOpts: {
      dataType: 'individual contributions',
      email: WEBMANAGER_EMAIL,
      name: candidateName,
      timePeriod: displayCycle,
      reason: reason,
    }
  });

  // Set up state map
  mapsEvent.init($map, $contributorState);
}

$(document).ready(function() {
  var query = URI.parseQuery(window.location.search);

  initOtherDocumentsTable();
  initSpendingTables();
  initDisbursementsTable();
  initContributionsTables();

  // If on the other spending tab, init the totals
  // Otherwise add an event listener to build them on showing the tab
  if (query.tab === 'other-spending') {
    new OtherSpendingTotals('independentExpenditures');
    new OtherSpendingTotals('electioneering');
    new OtherSpendingTotals('communicationCosts');
  } else {
    events.once('tabs.show.other-spending', function() {
      new OtherSpendingTotals('independentExpenditures');
      new OtherSpendingTotals('electioneering');
      new OtherSpendingTotals('communicationCosts');
    });
  }

  // If we're on the raising tab, load the state map
  if (query.tab === 'raising') {
    $.getJSON(mapUrl).done(function(data) {
      maps.stateMap($map, data, 400, 300, null, null, true, true);
    });
  } else {
    // Add an event listener that only fires once on showing the raising tab
    // in order to not make this API call unless its necessary
    events.once('tabs.show.raising', function() {
      $.getJSON(mapUrl).done(function(data) {
        maps.stateMap($map, data, 400, 300, null, null, true, true);
      });
    });
  }
});


/***/ }),

/***/ 340:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* global require, context */

var $ = __webpack_require__(0);
var _ = __webpack_require__(2);

var helpers = __webpack_require__(6);

var pathMap = {
  'independentExpenditures': '/schedules/schedule_e/by_candidate/',
  'communicationCosts': '/communication_costs/by_candidate/',
  'electioneering': '/electioneering/by_candidate/'
};

function OtherSpendingTotals(type) {
  this.$elm = $('.js-other-spending-totals[data-spending-type='+ type + ']');
  this.type = type;
  this.data = [];
  this.init();
}

OtherSpendingTotals.prototype.fetchData = function(page) {
  // Fetch the data for a given page
  // Page is required because if there's more than 100 results we need
  // to loop through all the pages
  var self = this;
  var url = helpers.buildUrl(
    pathMap[this.type],
    {
      candidate_id: context.candidateID,
      cycle: context.cycle,
      election_full: context.electionFull,
      page: page,
      per_page: 100
    }
  );

  $.getJSON(url).done(function(data) {
    var currentPage = data.pagination.page;
    if (data.results.length === 0) {
      // If no results, remove the component
      self.$elm.remove();
    } else {
      // Add the results to the existing data array
      self.data = self.data.concat(data.results);
      if (currentPage === data.pagination.pages) {
        // If we're on the last page, show the totals
        self.showTotals(self.data);
      } else {
        // Otherwise fetch data for the next page
        var nextPage = currentPage + 1;
        self.fetchData(nextPage);
      }
    }
  });
};

OtherSpendingTotals.prototype.init = function() {
  this.fetchData();
};

OtherSpendingTotals.prototype.showTotals = function(results) {
  if (this.type === 'electioneering') {
    // Electioneering comms aren't marked as support or oppose, so just add
    // them all together
    var total = _.reduce(results, function(memo, datum) {
        return  memo + datum.total;
      }, 0);
      this.$elm.find('.js-total-electioneering').html(helpers.currency(total));
  } else {
    // Get support and oppose totals by filtering results by the correct indicator
    // and then running _.reduce to add all the values
    var supportTotal = _.chain(results)
      .filter(function(value) {
        return value.support_oppose_indicator === 'S';
      })
      .reduce(function(memo, datum) {
        return  memo + datum.total;
      }, 0)
      .value();

    var opposeTotal = _.chain(results)
      .filter(function(value) {
        return value.support_oppose_indicator === 'O';
      })
      .reduce(function(memo, datum) {
        return  memo + datum.total;
      }, 0)
      .value();

    // Update the DOM with the values
    this.$elm.find('.js-support').html(helpers.currency(supportTotal));
    this.$elm.find('.js-oppose').html(helpers.currency(opposeTotal));

  }
};

module.exports = OtherSpendingTotals;


/***/ })

},[339]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9mZWMvc3RhdGljL2pzL21vZHVsZXMvbWFwcy1ldmVudC5qcyIsIndlYnBhY2s6Ly8vLi9mZWMvc3RhdGljL2pzL3BhZ2VzL2NhbmRpZGF0ZS1zaW5nbGUuanMiLCJ3ZWJwYWNrOi8vLy4vZmVjL3N0YXRpYy9qcy9tb2R1bGVzL290aGVyLXNwZW5kaW5nLXRvdGFscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLGFBQWE7QUFDM0MsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsR0FBRzs7QUFFSDtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7OztBQ2hEQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBLENBQUM7Ozs7Ozs7OztBQy9lRDs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSIsImZpbGUiOiJjYW5kaWRhdGUtc2luZ2xlLTIwYTY2OTBlNGIyMTM5OTM1NDAyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuXG52YXIgbWFwcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbWFwcycpO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFJvd0FuZFN0YXRlKCRtYXAsICR0YWJsZSwgc3RhdGUsIHNjcm9sbCkge1xuICB2YXIgJHNjcm9sbEJvZHkgPSAkdGFibGUuY2xvc2VzdCgnLmRhdGFUYWJsZXNfc2Nyb2xsQm9keScpO1xuICB2YXIgJHJvdyA9ICRzY3JvbGxCb2R5LmZpbmQoJ3NwYW5bZGF0YS1zdGF0ZT1cIicgKyBzdGF0ZSArICdcIl0nKTtcblxuICBpZiAoJHJvdy5sZW5ndGggPiAwKSB7XG4gICAgbWFwcy5oaWdobGlnaHRTdGF0ZSgkKCcuc3RhdGUtbWFwJyksIHN0YXRlKTtcbiAgICAkc2Nyb2xsQm9keS5maW5kKCcucm93LWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdyb3ctYWN0aXZlJyk7XG4gICAgJHJvdy5wYXJlbnRzKCd0cicpLmFkZENsYXNzKCdyb3ctYWN0aXZlJyk7XG4gICAgaWYgKHNjcm9sbCkge1xuICAgICAgJHNjcm9sbEJvZHkuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJHJvdy5jbG9zZXN0KCd0cicpLmhlaWdodCgpICogcGFyc2VJbnQoJHJvdy5hdHRyKCdkYXRhLXJvdycpKVxuICAgICAgfSwgNTAwKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdCgkbWFwLCAkdGFibGUpIHtcbiAgJG1hcC5vbignY2xpY2snLCAncGF0aFtkYXRhLXN0YXRlXScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGF0ZSA9ICQodGhpcykuYXR0cignZGF0YS1zdGF0ZScpO1xuICAgIGV2ZW50cy5lbWl0KCdzdGF0ZS5tYXAnLCB7c3RhdGU6IHN0YXRlfSk7XG4gIH0pO1xuXG4gICR0YWJsZS5vbignY2xpY2snLCAndHInLCBmdW5jdGlvbigpIHtcbiAgICBldmVudHMuZW1pdCgnc3RhdGUudGFibGUnLCB7XG4gICAgICBzdGF0ZTogJCh0aGlzKS5maW5kKCdzcGFuW2RhdGEtc3RhdGVdJykuYXR0cignZGF0YS1zdGF0ZScpXG4gICAgfSk7XG4gIH0pO1xuXG4gIGV2ZW50cy5vbignc3RhdGUudGFibGUnLCBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICBoaWdobGlnaHRSb3dBbmRTdGF0ZSgkbWFwLCAkKCcuZGF0YS10YWJsZScpLCBwYXJhbXMuc3RhdGUsIGZhbHNlKTtcbiAgfSk7XG5cbiAgZXZlbnRzLm9uKCdzdGF0ZS5tYXAnLCBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICB2YXIgJG1hcCA9ICQoJy5zdGF0ZS1tYXAnKTtcbiAgICBoaWdobGlnaHRSb3dBbmRTdGF0ZSgkbWFwLCAkdGFibGUsIHBhcmFtcy5zdGF0ZSwgdHJ1ZSk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaGlnaGxpZ2h0Um93QW5kU3RhdGU6IGhpZ2hsaWdodFJvd0FuZFN0YXRlLFxuICBpbml0OiBpbml0XG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9mZWMvc3RhdGljL2pzL21vZHVsZXMvbWFwcy1ldmVudC5qc1xuLy8gbW9kdWxlIGlkID0gMjY4XG4vLyBtb2R1bGUgY2h1bmtzID0gMTAgMjAiLCIndXNlIHN0cmljdCc7XG5cbi8qIGdsb2JhbCByZXF1aXJlLCBkb2N1bWVudCwgY29udGV4dCwgV0VCTUFOQUdFUl9FTUFJTCAqL1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xudmFyIFVSSSA9IHJlcXVpcmUoJ3VyaWpzJyk7XG5cbnZhciBtYXBzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9tYXBzJyk7XG52YXIgbWFwc0V2ZW50ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9tYXBzLWV2ZW50Jyk7XG52YXIgdGFibGVzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy90YWJsZXMnKTtcbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9oZWxwZXJzJyk7XG52YXIgY29sdW1uSGVscGVycyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvY29sdW1uLWhlbHBlcnMnKTtcbnZhciBjb2x1bW5zID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9jb2x1bW5zJyk7XG52YXIgZXZlbnRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudHMnKTtcbnZhciBPdGhlclNwZW5kaW5nVG90YWxzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9vdGhlci1zcGVuZGluZy10b3RhbHMnKTtcblxudmFyIGFnZ3JlZ2F0ZUNhbGxiYWNrcyA9IHtcbiAgYWZ0ZXJSZW5kZXI6IHRhYmxlcy5iYXJzQWZ0ZXJSZW5kZXIuYmluZCh1bmRlZmluZWQsIHVuZGVmaW5lZCksXG59O1xuXG4vLyBET00gZWxlbWVudCBhbmQgVVJMIGZvciBidWlsZGluZyB0aGUgc3RhdGUgbWFwXG52YXIgJG1hcCA9ICQoJy5zdGF0ZS1tYXAnKTtcbnZhciBtYXBVcmwgPSBoZWxwZXJzLmJ1aWxkVXJsKFxuICBbJ3NjaGVkdWxlcycsICdzY2hlZHVsZV9hJywgJ2J5X3N0YXRlJywgJ2J5X2NhbmRpZGF0ZSddLFxuICB7XG4gICAgY2FuZGlkYXRlX2lkOiAkbWFwLmRhdGEoJ2NhbmRpZGF0ZS1pZCcpLFxuICAgIGN5Y2xlOiAkbWFwLmRhdGEoJ2N5Y2xlJyksXG4gICAgcGVyX3BhZ2U6IDk5XG4gIH1cbik7XG5cbnZhciBleHBlbmRpdHVyZUNvbHVtbnMgPSBbXG4gIHtcbiAgICBkYXRhOiAndG90YWwnLFxuICAgIGNsYXNzTmFtZTogJ2FsbCcsXG4gICAgb3JkZXJhYmxlOiB0cnVlLFxuICAgIG9yZGVyU2VxdWVuY2U6IFsnZGVzYycsICdhc2MnXSxcbiAgICByZW5kZXI6IGNvbHVtbkhlbHBlcnMuYnVpbGRUb3RhbExpbmsoWydpbmRlcGVuZGVudC1leHBlbmRpdHVyZXMnXSwgZnVuY3Rpb24oZGF0YSwgdHlwZSwgcm93KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdXBwb3J0X29wcG9zZV9pbmRpY2F0b3I6IHJvdy5zdXBwb3J0X29wcG9zZV9pbmRpY2F0b3IsXG4gICAgICAgIGNhbmRpZGF0ZV9pZDogcm93LmNhbmRpZGF0ZV9pZCxcbiAgICAgIH07XG4gICAgfSlcbiAgfSxcbiAgY29sdW1ucy5jb21taXR0ZWVDb2x1bW4oe1xuICAgIGRhdGE6ICdjb21taXR0ZWUnLFxuICAgIGNsYXNzTmFtZTogJ2FsbCdcbiAgfSksXG4gIGNvbHVtbnMuc3VwcG9ydE9wcG9zZUNvbHVtblxuXTtcblxudmFyIGNvbW11bmljYXRpb25Db3N0Q29sdW1ucyA9IFtcbiAge1xuICAgIGRhdGE6ICd0b3RhbCcsXG4gICAgY2xhc3NOYW1lOiAnYWxsJyxcbiAgICBvcmRlcmFibGU6IHRydWUsXG4gICAgb3JkZXJTZXF1ZW5jZTogWydkZXNjJywgJ2FzYyddLFxuICAgIHJlbmRlcjogY29sdW1uSGVscGVycy5idWlsZFRvdGFsTGluayhbJ2NvbW11bmljYXRpb24tY29zdHMnXSwgZnVuY3Rpb24oZGF0YSwgdHlwZSwgcm93KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdXBwb3J0X29wcG9zZV9pbmRpY2F0b3I6IHJvdy5zdXBwb3J0X29wcG9zZV9pbmRpY2F0b3IsXG4gICAgICAgIGNhbmRpZGF0ZV9pZDogcm93LmNhbmRpZGF0ZV9pZCxcbiAgICAgIH07XG4gICAgfSlcbiAgfSxcbiAgY29sdW1ucy5jb21taXR0ZWVDb2x1bW4oe1xuICAgIGRhdGE6ICdjb21taXR0ZWUnLFxuICAgIGNsYXNzTmFtZTogJ2FsbCdcbiAgfSksXG4gIGNvbHVtbnMuc3VwcG9ydE9wcG9zZUNvbHVtblxuXTtcblxudmFyIGVsZWN0aW9uZWVyaW5nQ29sdW1ucyA9IFtcbiAge1xuICAgIGRhdGE6ICd0b3RhbCcsXG4gICAgY2xhc3NOYW1lOiAnYWxsJyxcbiAgICBvcmRlcmFibGU6IHRydWUsXG4gICAgb3JkZXJTZXF1ZW5jZTogWydkZXNjJywgJ2FzYyddLFxuICAgIHJlbmRlcjogY29sdW1uSGVscGVycy5idWlsZFRvdGFsTGluayhbJ2VsZWN0aW9uZWVyaW5nLWNvbW11bmljYXRpb25zJ10sXG4gICAgICBmdW5jdGlvbihkYXRhLCB0eXBlLCByb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjYW5kaWRhdGVfaWQ6IHJvdy5jYW5kaWRhdGVfaWRcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gIH0sXG4gIGNvbHVtbnMuY29tbWl0dGVlQ29sdW1uKHtcbiAgICBkYXRhOiAnY29tbWl0dGVlJyxcbiAgICBjbGFzc05hbWU6ICdhbGwnXG4gIH0pXG5dO1xuXG52YXIgb3RoZXJEb2N1bWVudHNDb2x1bW5zID0gW1xuICBjb2x1bW5IZWxwZXJzLnVybENvbHVtbigncGRmX3VybCcsIHtcbiAgICBkYXRhOiAnZG9jdW1lbnRfZGVzY3JpcHRpb24nLFxuICAgIGNsYXNzTmFtZTogJ2FsbCBjb2x1bW4tLW1lZGl1bScsXG4gICAgb3JkZXJhYmxlOiBmYWxzZVxuICB9KSxcbiAge1xuICAgIGRhdGE6ICdtb3N0X3JlY2VudCcsXG4gICAgY2xhc3NOYW1lOiAnYWxsJyxcbiAgICBvcmRlcmFibGU6IGZhbHNlLFxuICAgIHJlbmRlcjogZnVuY3Rpb24oZGF0YSwgdHlwZSwgcm93KSB7XG4gICAgICB2YXIgdmVyc2lvbiA9IGhlbHBlcnMuYW1lbmRtZW50VmVyc2lvbihkYXRhKTtcbiAgICAgIGlmICh2ZXJzaW9uID09PSAnVmVyc2lvbiB1bmtub3duJykge1xuICAgICAgICByZXR1cm4gJzxpIGNsYXNzPVwiaWNvbi1ibGFua1wiPjwvaT5WZXJzaW9uIHVua25vd248YnI+JyArXG4gICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1ibGFua1wiPjwvaT4nICsgcm93LmZlY19maWxlX2lkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJvdy5mZWNfZmlsZV9pZCAhPT0gbnVsbCkge1xuICAgICAgICAgIHZlcnNpb24gPSB2ZXJzaW9uICsgJzxicj48aSBjbGFzcz1cImljb24tYmxhbmtcIj48L2k+JyArIHJvdy5mZWNfZmlsZV9pZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGNvbHVtbnMuZGF0ZUNvbHVtbih7XG4gICAgZGF0YTogJ3JlY2VpcHRfZGF0ZScsXG4gICAgY2xhc3NOYW1lOiAnbWluLXRhYmxldCdcbiAgfSlcbl07XG5cbnZhciBpdGVtaXplZERpc2J1cnNlbWVudENvbHVtbnMgPSBbXG4gIHtcbiAgICBkYXRhOiAnY29tbWl0dGVlX2lkJyxcbiAgICBjbGFzc05hbWU6ICdhbGwnLFxuICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgcmVuZGVyOiBmdW5jdGlvbihkYXRhLCB0eXBlLCByb3cpIHtcbiAgICAgIHJldHVybiBjb2x1bW5IZWxwZXJzLmJ1aWxkRW50aXR5TGluayhcbiAgICAgICAgcm93LmNvbW1pdHRlZS5uYW1lLFxuICAgICAgICBoZWxwZXJzLmJ1aWxkQXBwVXJsKFsnY29tbWl0dGVlJywgcm93LmNvbW1pdHRlZV9pZF0pLFxuICAgICAgICAnY29tbWl0dGVlJ1xuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHtcbiAgICBkYXRhOiAncmVjaXBpZW50X25hbWUnLFxuICAgIGNsYXNzTmFtZTogJ2FsbCcsXG4gICAgb3JkZXJhYmxlOiBmYWxzZSxcbiAgfSxcbiAge1xuICAgIGRhdGE6ICdyZWNpcGllbnRfc3RhdGUnLFxuICAgIGNsYXNzTmFtZTogJ21pbi10YWJsZXQgaGlkZS1wYW5lbCcsXG4gICAgb3JkZXJhYmxlOiBmYWxzZSxcbiAgfSxcbiAge1xuICAgIGRhdGE6ICdkaXNidXJzZW1lbnRfZGVzY3JpcHRpb24nLFxuICAgIGNsYXNzTmFtZTogJ2FsbCcsXG4gICAgb3JkZXJhYmxlOiBmYWxzZSxcbiAgICBkZWZhdWx0Q29udGVudDogJ05PVCBSRVBPUlRFRCdcbiAgfSxcbiAgY29sdW1ucy5kYXRlQ29sdW1uKHtcbiAgICBkYXRhOiAnZGlzYnVyc2VtZW50X2RhdGUnLFxuICAgIGNsYXNzTmFtZTogJ21pbi10YWJsZXQnXG4gIH0pLFxuICBjb2x1bW5zLmN1cnJlbmN5Q29sdW1uKHtcbiAgICBkYXRhOiAnZGlzYnVyc2VtZW50X2Ftb3VudCcsXG4gICAgY2xhc3NOYW1lOiAnY29sdW1uLS1udW1iZXInXG4gIH0pLFxuXTtcblxudmFyIGluZGl2aWR1YWxDb250cmlidXRpb25zQ29sdW1ucyA9IFtcbiAge1xuICAgIGRhdGE6ICdjb250cmlidXRvcl9uYW1lJyxcbiAgICBjbGFzc05hbWU6ICdhbGwnLFxuICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gIH0sXG4gIHtcbiAgICBkYXRhOiAnY29tbWl0dGVlJyxcbiAgICBjbGFzc05hbWU6ICdhbGwnLFxuICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgcGFnaW5hdG9yOiB0YWJsZXMuU2Vla1BhZ2luYXRvcixcbiAgICByZW5kZXI6IGZ1bmN0aW9uKGRhdGEsIHR5cGUsIHJvdykge1xuICAgICAgcmV0dXJuIGNvbHVtbkhlbHBlcnMuYnVpbGRFbnRpdHlMaW5rKFxuICAgICAgICByb3cuY29tbWl0dGVlLm5hbWUsXG4gICAgICAgIGhlbHBlcnMuYnVpbGRBcHBVcmwoWydjb21taXR0ZWUnLCByb3cuY29tbWl0dGVlX2lkXSksXG4gICAgICAgICdjb21taXR0ZWUnXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgY29sdW1ucy5kYXRlQ29sdW1uKHtcbiAgICBkYXRhOiAnY29udHJpYnV0aW9uX3JlY2VpcHRfZGF0ZScsXG4gICAgY2xhc3NOYW1lOiAnbWluLXRhYmxldCdcbiAgfSksXG4gIGNvbHVtbnMuY3VycmVuY3lDb2x1bW4oe1xuICAgIGRhdGE6ICdjb250cmlidXRpb25fcmVjZWlwdF9hbW91bnQnLFxuICAgIGNsYXNzTmFtZTogJ2NvbHVtbi0tbnVtYmVyJ1xuICB9KSxcbl07XG5cbi8vIEJlZ2luIGRhdGF0YWJsZSBmdW5jdGlvbnMgaW4gb3JkZXIgb2YgdGFiIGFwcGVhcmFuY2Vcbi8vIC0gRmluYW5jaWFsIHN1bW1hcnk6XG4vLyAgICogQ2FuZGlkYXRlIGZpbGluZyB5ZWFyc1xuLy8gLSBBYm91dCB0aGlzIGNhbmRpZGF0ZTpcbi8vICAgKiBPdGhlciBkb2N1bWVudHMgZmlsZWRcbi8vIC0gU3BlbmRpbmcgYnkgb3RoZXJzIHRvIHN1cHBvcnQvb3Bwb3NlOlxuLy8gICAqIEluZGVwZW5kZW50IGV4cGVuZGl0dXJlcyxcbi8vICAgKiBDb21tdW5pY2F0aW9uIGNvc3RzLFxuLy8gICAqIEVsZWN0aW9uZWVyaW5nIGNvbW11bmljYXRpb25zXG4vLyAtIEl0ZW1pemVkIGRpc2J1cnNlbWVudHM6XG4vLyAgICogRGlzYnVyc2VtZW50cyBieSB0cmFuc2FjdGlvblxuLy8gLSBJbmRpdmlkdWFsIGNvbnRyaWJ1dGlvbnM6XG4vLyAgICogQ29udHJpYnV0b3Igc3RhdGUsIHNpemUsIGFsbCB0cmFuc2FjdGlvbnNcblxuZnVuY3Rpb24gaW5pdE90aGVyRG9jdW1lbnRzVGFibGUoKSB7XG4gIHZhciAkdGFibGUgPSAkKCd0YWJsZVtkYXRhLXR5cGU9XCJvdGhlci1kb2N1bWVudHNcIl0nKTtcbiAgdmFyIGNhbmRpZGF0ZUlkID0gJHRhYmxlLmRhdGEoJ2NhbmRpZGF0ZScpO1xuICB2YXIgcGF0aCA9IFsnZmlsaW5ncyddO1xuICB0YWJsZXMuRGF0YVRhYmxlLmRlZmVyKCR0YWJsZSwge1xuICAgIHBhdGg6IHBhdGgsXG4gICAgcXVlcnk6IHtcbiAgICAgIGNhbmRpZGF0ZV9pZDogY2FuZGlkYXRlSWQsXG4gICAgICBmb3JtX3R5cGU6ICdGOTknXG4gICAgfSxcbiAgICBjb2x1bW5zOiBvdGhlckRvY3VtZW50c0NvbHVtbnMsXG4gICAgb3JkZXI6IFtbMiwgJ2Rlc2MnXV0sXG4gICAgZG9tOiB0YWJsZXMuc2ltcGxlRE9NLFxuICAgIHBhZ2luZ1R5cGU6ICdzaW1wbGUnLFxuICAgIGxlbmd0aE1lbnU6IFsxMCwgMzAsIDUwXSxcbiAgICBoaWRlRW1wdHk6IGZhbHNlXG4gIH0pO1xufVxuXG52YXIgdGFibGVPcHRzID0ge1xuICAnaW5kZXBlbmRlbnQtZXhwZW5kaXR1cmVzJzoge1xuICAgIHBhdGg6IFsnc2NoZWR1bGVzJywgJ3NjaGVkdWxlX2UnLCAnYnlfY2FuZGlkYXRlJ10sXG4gICAgY29sdW1uczogZXhwZW5kaXR1cmVDb2x1bW5zLFxuICAgIHRpdGxlOiAnaW5kZXBlbmRlbnQgZXhwZW5kaXR1cmVzJ1xuICB9LFxuICAnY29tbXVuaWNhdGlvbi1jb3N0cyc6IHtcbiAgICBwYXRoOiBbJ2NvbW11bmljYXRpb25fY29zdHMnLCAnYnlfY2FuZGlkYXRlJ10sXG4gICAgY29sdW1uczogY29tbXVuaWNhdGlvbkNvc3RDb2x1bW5zLFxuICAgIHRpdGxlOiAnY29tbXVuaWNhdGlvbiBjb3N0cydcbiAgfSxcbiAgJ2VsZWN0aW9uZWVyaW5nJzoge1xuICAgIHBhdGg6IFsnZWxlY3Rpb25lZXJpbmcnLCAnYnlfY2FuZGlkYXRlJ10sXG4gICAgY29sdW1uczogZWxlY3Rpb25lZXJpbmdDb2x1bW5zLFxuICAgIHRpdGxlOiAnZWxlY3Rpb25lZXJpbmcgY29tbXVuaWNhdGlvbnMnXG4gIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTcGVuZGluZ1RhYmxlcygpIHtcbiAgJCgnLmRhdGEtdGFibGUnKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCB0YWJsZSkge1xuICAgIHZhciAkdGFibGUgPSAkKHRhYmxlKTtcbiAgICB2YXIgZGF0YVR5cGUgPSAkdGFibGUuZGF0YSgndHlwZScpO1xuICAgIHZhciBvcHRzID0gdGFibGVPcHRzW2RhdGFUeXBlXTtcbiAgICB2YXIgcXVlcnkgPSB7XG4gICAgICBjYW5kaWRhdGVfaWQ6ICR0YWJsZS5kYXRhKCdjYW5kaWRhdGUnKSxcbiAgICAgIGN5Y2xlOiAkdGFibGUuZGF0YSgnY3ljbGUnKSxcbiAgICAgIGVsZWN0aW9uX2Z1bGw6ICR0YWJsZS5kYXRhKCdlbGVjdGlvbi1mdWxsJylcbiAgICB9O1xuICAgIHZhciBkaXNwbGF5Q3ljbGUgPSBoZWxwZXJzLmZvcm1hdEN5Y2xlUmFuZ2UoJHRhYmxlLmRhdGEoJ2N5Y2xlJyksICR0YWJsZS5kYXRhKCdkdXJhdGlvbicpKTtcbiAgICBpZihkaXNwbGF5Q3ljbGUgPT0gbnVsbCkge1xuICAgICAgZGlzcGxheUN5Y2xlID0gXCJ1bnNwZWNpZmllZCBjeWNsZVwiO1xuICAgIH1cbiAgICBpZiAob3B0cykge1xuICAgICAgdGFibGVzLkRhdGFUYWJsZS5kZWZlcigkdGFibGUsIHtcbiAgICAgICAgcGF0aDogb3B0cy5wYXRoLFxuICAgICAgICBxdWVyeTogcXVlcnksXG4gICAgICAgIGNvbHVtbnM6IG9wdHMuY29sdW1ucyxcbiAgICAgICAgb3JkZXI6IFtbMCwgJ2Rlc2MnXV0sXG4gICAgICAgIGRvbTogdGFibGVzLnNpbXBsZURPTSxcbiAgICAgICAgcGFnaW5nVHlwZTogJ3NpbXBsZScsXG4gICAgICAgIGxlbmd0aENoYW5nZTogdHJ1ZSxcbiAgICAgICAgcGFnZUxlbmd0aDogMTAsXG4gICAgICAgIGxlbmd0aE1lbnU6IFsxMCwgNTAsIDEwMF0sXG4gICAgICAgIGhpZGVFbXB0eTogdHJ1ZSxcbiAgICAgICAgaGlkZUVtcHR5T3B0czoge1xuICAgICAgICAgIGRhdGFUeXBlOiBvcHRzLnRpdGxlLFxuICAgICAgICAgIGVtYWlsOiBXRUJNQU5BR0VSX0VNQUlMLFxuICAgICAgICAgIG5hbWU6IGNvbnRleHQubmFtZSxcbiAgICAgICAgICB0aW1lUGVyaW9kOiBkaXNwbGF5Q3ljbGUsXG4gICAgICAgICAgcmVhc29uOiBoZWxwZXJzLm1pc3NpbmdEYXRhUmVhc29uKGRhdGFUeXBlKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0RGlzYnVyc2VtZW50c1RhYmxlKCkge1xuICB2YXIgJHRhYmxlID0gJCgndGFibGVbZGF0YS10eXBlPVwiaXRlbWl6ZWQtZGlzYnVyc2VtZW50c1wiXScpO1xuICB2YXIgcGF0aCA9IFsnc2NoZWR1bGVzJywgJ3NjaGVkdWxlX2InXTtcbiAgdmFyIGNvbW1pdHRlZUlkRGF0YSA9ICR0YWJsZS5kYXRhKCdjb21taXR0ZWUtaWQnKTtcbiAgdmFyIGNvbW1pdHRlZUlkcyA9IFwiXCI7XG4gIGlmKGNvbW1pdHRlZUlkRGF0YSkge1xuICAgIGNvbW1pdHRlZUlkcyA9IGNvbW1pdHRlZUlkRGF0YS5zcGxpdCgnLCcpLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuICB2YXIgb3B0cyA9IHtcbiAgICAvLyBwb3NzaWJpbGl0eSBvZiBtdWx0aXBsZSBjb21taXR0ZWVzLCBzbyBzcGxpdCBpbnRvIGFycmF5XG4gICAgY29tbWl0dGVlX2lkOiBjb21taXR0ZWVJZHMsXG4gICAgdGl0bGU6ICdpdGVtaXplZCBkaXNidXJzZW1lbnRzJyxcbiAgICBuYW1lOiAkdGFibGUuZGF0YSgnbmFtZScpLFxuICAgIGN5Y2xlOiAkdGFibGUuZGF0YSgnY3ljbGUnKVxuICB9O1xuICB2YXIgZGlzcGxheUN5Y2xlID0gaGVscGVycy5mb3JtYXRDeWNsZVJhbmdlKCR0YWJsZS5kYXRhKCdjeWNsZScpLCAkdGFibGUuZGF0YSgnZHVyYXRpb24nKSk7XG4gIGlmKGRpc3BsYXlDeWNsZSA9PSBudWxsKSB7XG4gICAgZGlzcGxheUN5Y2xlID0gXCJ1bnNwZWNpZmllZCBjeWNsZVwiO1xuICB9XG4gIHRhYmxlcy5EYXRhVGFibGUuZGVmZXIoJHRhYmxlLCB7XG4gICAgcGF0aDogcGF0aCxcbiAgICBxdWVyeToge1xuICAgICAgY29tbWl0dGVlX2lkOiBvcHRzLmNvbW1pdHRlZV9pZCxcbiAgICAgIHR3b195ZWFyX3RyYW5zYWN0aW9uX3BlcmlvZDogb3B0cy5jeWNsZVxuICAgIH0sXG4gICAgY29sdW1uczogaXRlbWl6ZWREaXNidXJzZW1lbnRDb2x1bW5zLFxuICAgIG9yZGVyOiBbWzQsICdkZXNjJ11dLFxuICAgIGRvbTogdGFibGVzLnNpbXBsZURPTSxcbiAgICBwYWdpbmF0b3I6IHRhYmxlcy5TZWVrUGFnaW5hdG9yLFxuICAgIGxlbmd0aE1lbnU6IFsxMCwgNTAsIDEwMF0sXG4gICAgdXNlRmlsdGVyczogdHJ1ZSxcbiAgICB1c2VFeHBvcnQ6IHRydWUsXG4gICAgc2luZ2xlRW50aXR5SXRlbWl6ZWRFeHBvcnQ6IHRydWUsXG4gICAgaGlkZUVtcHR5OiB0cnVlLFxuICAgIGhpZGVFbXB0eU9wdHM6IHtcbiAgICAgIGVtYWlsOiBXRUJNQU5BR0VSX0VNQUlMLFxuICAgICAgZGF0YVR5cGU6IG9wdHMudGl0bGUsXG4gICAgICBuYW1lOiBvcHRzLm5hbWUsXG4gICAgICB0aW1lUGVyaW9kOiBkaXNwbGF5Q3ljbGUsXG4gICAgICByZWFzb246IGhlbHBlcnMubWlzc2luZ0RhdGFSZWFzb24oJ2Rpc2J1cnNlbWVudHMnKVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRDb250cmlidXRpb25zVGFibGVzKCkge1xuICB2YXIgJGFsbFRyYW5zYWN0aW9ucyA9ICQoJ3RhYmxlW2RhdGEtdHlwZT1cImluZGl2aWR1YWwtY29udHJpYnV0aW9uc1wiXScpO1xuICB2YXIgJGNvbnRyaWJ1dGlvblNpemUgPSAkKCd0YWJsZVtkYXRhLXR5cGU9XCJjb250cmlidXRpb24tc2l6ZVwiXScpO1xuICB2YXIgJGNvbnRyaWJ1dG9yU3RhdGUgPSAkKCd0YWJsZVtkYXRhLXR5cGU9XCJjb250cmlidXRvci1zdGF0ZVwiXScpO1xuICB2YXIgZGlzcGxheUN5Y2xlID0gaGVscGVycy5mb3JtYXRDeWNsZVJhbmdlKCRhbGxUcmFuc2FjdGlvbnMuZGF0YSgnY3ljbGUnKSwgMik7XG4gIHZhciBjYW5kaWRhdGVOYW1lID0gJGFsbFRyYW5zYWN0aW9ucy5kYXRhKCduYW1lJyk7XG4gIHZhciBjb21taXR0ZWVJZERhdGEgPSAkYWxsVHJhbnNhY3Rpb25zLmRhdGEoJ2NvbW1pdHRlZS1pZCcpO1xuICB2YXIgY29tbWl0dGVlSWRzID0gXCJcIjtcbiAgaWYoY29tbWl0dGVlSWREYXRhKSB7XG4gICAgY29tbWl0dGVlSWRzID0gY29tbWl0dGVlSWREYXRhLnNwbGl0KCcsJykuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG4gIHZhciBvcHRzID0ge1xuICAgIC8vIHBvc3NpYmlsaXR5IG9mIG11bHRpcGxlIGNvbW1pdHRlZXMsIHNvIHNwbGl0IGludG8gYXJyYXlcbiAgICAvLyBhbHNvLCBmaWx0ZXIgYXJyYXkgdG8gcmVtb3ZlIGFueSBibGFuayB2YWx1ZXNcbiAgICBjb21taXR0ZWVfaWQ6IGNvbW1pdHRlZUlkcyxcbiAgICBjYW5kaWRhdGVfaWQ6ICRhbGxUcmFuc2FjdGlvbnMuZGF0YSgnY2FuZGlkYXRlLWlkJyksXG4gICAgdGl0bGU6ICdpbmRpdmlkdWFsIGNvbnRyaWJ1dGlvbnMnLFxuICAgIG5hbWU6IGNhbmRpZGF0ZU5hbWUsXG4gICAgY3ljbGU6ICRhbGxUcmFuc2FjdGlvbnMuZGF0YSgnY3ljbGUnKSxcbiAgfTtcblxuICB2YXIgcmVhc29uID0gaGVscGVycy5taXNzaW5nRGF0YVJlYXNvbignY29udHJpYnV0aW9ucycpO1xuXG4gIHRhYmxlcy5EYXRhVGFibGUuZGVmZXIoJGFsbFRyYW5zYWN0aW9ucywge1xuICAgIHBhdGg6IFsnc2NoZWR1bGVzJywgJ3NjaGVkdWxlX2EnXSxcbiAgICBxdWVyeToge1xuICAgICAgY29tbWl0dGVlX2lkOiBvcHRzLmNvbW1pdHRlZV9pZCxcbiAgICAgIGlzX2luZGl2aWR1YWw6IHRydWUsXG4gICAgICB0d29feWVhcl90cmFuc2FjdGlvbl9wZXJpb2Q6IG9wdHMuY3ljbGVcbiAgICB9LFxuICAgIGNvbHVtbnM6IGluZGl2aWR1YWxDb250cmlidXRpb25zQ29sdW1ucyxcbiAgICBvcmRlcjogW1syLCAnZGVzYyddXSxcbiAgICBkb206IHRhYmxlcy5zaW1wbGVET00sXG4gICAgcGFnaW5hdG9yOiB0YWJsZXMuU2Vla1BhZ2luYXRvcixcbiAgICB1c2VGaWx0ZXJzOiB0cnVlLFxuICAgIHVzZUV4cG9ydDogdHJ1ZSxcbiAgICBzaW5nbGVFbnRpdHlJdGVtaXplZEV4cG9ydDogdHJ1ZSxcbiAgICBoaWRlRW1wdHk6IHRydWUsXG4gICAgaGlkZUVtcHR5T3B0czoge1xuICAgICAgZGF0YVR5cGU6ICdpbmRpdmlkdWFsIGNvbnRyaWJ1dGlvbnMnLFxuICAgICAgZW1haWw6IFdFQk1BTkFHRVJfRU1BSUwsXG4gICAgICBuYW1lOiBjYW5kaWRhdGVOYW1lLFxuICAgICAgdGltZVBlcmlvZDogZGlzcGxheUN5Y2xlLFxuICAgICAgcmVhc29uOiByZWFzb25cbiAgICB9XG4gIH0pO1xuXG4gIHRhYmxlcy5EYXRhVGFibGUuZGVmZXIoJGNvbnRyaWJ1dG9yU3RhdGUsIHtcbiAgICBwYXRoOiBbJ3NjaGVkdWxlcycsICdzY2hlZHVsZV9hJywgJ2J5X3N0YXRlJywgJ2J5X2NhbmRpZGF0ZSddLFxuICAgIHF1ZXJ5OiB7XG4gICAgICBjYW5kaWRhdGVfaWQ6IG9wdHMuY2FuZGlkYXRlX2lkLFxuICAgICAgY3ljbGU6IG9wdHMuY3ljbGUsXG4gICAgICBzb3J0X2hpZGVfbnVsbDogZmFsc2UsXG4gICAgICBwZXJfcGFnZTogOTlcbiAgICB9LFxuICAgIGNvbHVtbnM6IFt7XG4gICAgICBkYXRhOiAnc3RhdGVfZnVsbCcsXG4gICAgICB3aWR0aDogJzUwJScsXG4gICAgICBjbGFzc05hbWU6ICdhbGwnLFxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkYXRhLCB0eXBlLCByb3csIG1ldGEpIHtcbiAgICAgICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSBkYXRhO1xuICAgICAgICBzcGFuLnNldEF0dHJpYnV0ZSgnZGF0YS1zdGF0ZScsIGRhdGEpO1xuICAgICAgICBzcGFuLnNldEF0dHJpYnV0ZSgnZGF0YS1yb3cnLCBtZXRhLnJvdyk7XG4gICAgICAgIHJldHVybiBzcGFuLm91dGVySFRNTDtcbiAgICAgIH1cbiAgICB9LFxuICAgICAge1xuICAgICAgICBkYXRhOiAndG90YWwnLFxuICAgICAgICB3aWR0aDogJzUwJScsXG4gICAgICAgIGNsYXNzTmFtZTogJ2FsbCcsXG4gICAgICAgIG9yZGVyU2VxdWVuY2U6IFsnZGVzYycsICdhc2MnXSxcbiAgICAgICAgcmVuZGVyOiBjb2x1bW5IZWxwZXJzLmJ1aWxkVG90YWxMaW5rKFsncmVjZWlwdHMnLCAnaW5kaXZpZHVhbC1jb250cmlidXRpb25zJ10sXG4gICAgICAgICAgZnVuY3Rpb24oZGF0YSwgdHlwZSwgcm93KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBjb250cmlidXRvcl9zdGF0ZTogcm93LnN0YXRlLFxuICAgICAgICAgICAgICBjb21taXR0ZWVfaWQ6IG9wdHMuY29tbWl0dGVlX2lkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgfV0sXG4gICAgY2FsbGJhY2tzOiBhZ2dyZWdhdGVDYWxsYmFja3MsXG4gICAgZG9tOiAndCcsXG4gICAgb3JkZXI6IFtbMSwgJ2Rlc2MnXV0sXG4gICAgcGFnaW5nOiBmYWxzZSxcbiAgICBzY3JvbGxZOiA0MDAsXG4gICAgc2Nyb2xsQ29sbGFwc2U6IHRydWVcbiAgfSk7XG5cbiAgdGFibGVzLkRhdGFUYWJsZS5kZWZlcigkY29udHJpYnV0aW9uU2l6ZSwge1xuICAgIHBhdGg6IFsnc2NoZWR1bGVzJywgJ3NjaGVkdWxlX2EnLCAnYnlfc2l6ZScsICdieV9jYW5kaWRhdGUnXSxcbiAgICBxdWVyeToge1xuICAgICAgY2FuZGlkYXRlX2lkOiBvcHRzLmNhbmRpZGF0ZV9pZCxcbiAgICAgIGN5Y2xlOiBvcHRzLmN5Y2xlLFxuICAgICAgc29ydDogJ3NpemUnXG4gICAgfSxcbiAgICBjb2x1bW5zOiBbe1xuICAgICAgZGF0YTogJ3NpemUnLFxuICAgICAgd2lkdGg6ICc1MCUnLFxuICAgICAgY2xhc3NOYW1lOiAnYWxsJyxcbiAgICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGNvbHVtbkhlbHBlcnMuc2l6ZUluZm9bZGF0YV0ubGFiZWw7XG4gICAgICB9XG4gICAgfSxcbiAgICAgIHtcbiAgICAgICAgZGF0YTogJ3RvdGFsJyxcbiAgICAgICAgd2lkdGg6ICc1MCUnLFxuICAgICAgICBjbGFzc05hbWU6ICdhbGwnLFxuICAgICAgICBvcmRlclNlcXVlbmNlOiBbJ2Rlc2MnLCAnYXNjJ10sXG4gICAgICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgICAgIHJlbmRlcjogY29sdW1uSGVscGVycy5idWlsZFRvdGFsTGluayhbJ3JlY2VpcHRzJywgJ2luZGl2aWR1YWwtY29udHJpYnV0aW9ucyddLFxuICAgICAgICAgIGZ1bmN0aW9uKGRhdGEsIHR5cGUsIHJvdykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGNvbHVtbkhlbHBlcnMuZ2V0U2l6ZVBhcmFtcyhyb3cuc2l6ZSk7XG4gICAgICAgICAgICBwYXJhbXMuY29tbWl0dGVlX2lkID0gb3B0cy5jb21taXR0ZWVfaWQ7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgfV0sXG4gICAgY2FsbGJhY2tzOiBhZ2dyZWdhdGVDYWxsYmFja3MsXG4gICAgZG9tOiAndCcsXG4gICAgb3JkZXI6IGZhbHNlLFxuICAgIHBhZ2luZ1R5cGU6ICdzaW1wbGUnLFxuICAgIGxlbmd0aENoYW5nZTogZmFsc2UsXG4gICAgcGFnZUxlbmd0aDogMTAsXG4gICAgaGlkZUVtcHR5OiB0cnVlLFxuICAgIGhpZGVFbXB0eU9wdHM6IHtcbiAgICAgIGRhdGFUeXBlOiAnaW5kaXZpZHVhbCBjb250cmlidXRpb25zJyxcbiAgICAgIGVtYWlsOiBXRUJNQU5BR0VSX0VNQUlMLFxuICAgICAgbmFtZTogY2FuZGlkYXRlTmFtZSxcbiAgICAgIHRpbWVQZXJpb2Q6IGRpc3BsYXlDeWNsZSxcbiAgICAgIHJlYXNvbjogcmVhc29uLFxuICAgIH1cbiAgfSk7XG5cbiAgLy8gU2V0IHVwIHN0YXRlIG1hcFxuICBtYXBzRXZlbnQuaW5pdCgkbWFwLCAkY29udHJpYnV0b3JTdGF0ZSk7XG59XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgcXVlcnkgPSBVUkkucGFyc2VRdWVyeSh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcblxuICBpbml0T3RoZXJEb2N1bWVudHNUYWJsZSgpO1xuICBpbml0U3BlbmRpbmdUYWJsZXMoKTtcbiAgaW5pdERpc2J1cnNlbWVudHNUYWJsZSgpO1xuICBpbml0Q29udHJpYnV0aW9uc1RhYmxlcygpO1xuXG4gIC8vIElmIG9uIHRoZSBvdGhlciBzcGVuZGluZyB0YWIsIGluaXQgdGhlIHRvdGFsc1xuICAvLyBPdGhlcndpc2UgYWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGJ1aWxkIHRoZW0gb24gc2hvd2luZyB0aGUgdGFiXG4gIGlmIChxdWVyeS50YWIgPT09ICdvdGhlci1zcGVuZGluZycpIHtcbiAgICBuZXcgT3RoZXJTcGVuZGluZ1RvdGFscygnaW5kZXBlbmRlbnRFeHBlbmRpdHVyZXMnKTtcbiAgICBuZXcgT3RoZXJTcGVuZGluZ1RvdGFscygnZWxlY3Rpb25lZXJpbmcnKTtcbiAgICBuZXcgT3RoZXJTcGVuZGluZ1RvdGFscygnY29tbXVuaWNhdGlvbkNvc3RzJyk7XG4gIH0gZWxzZSB7XG4gICAgZXZlbnRzLm9uY2UoJ3RhYnMuc2hvdy5vdGhlci1zcGVuZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgbmV3IE90aGVyU3BlbmRpbmdUb3RhbHMoJ2luZGVwZW5kZW50RXhwZW5kaXR1cmVzJyk7XG4gICAgICBuZXcgT3RoZXJTcGVuZGluZ1RvdGFscygnZWxlY3Rpb25lZXJpbmcnKTtcbiAgICAgIG5ldyBPdGhlclNwZW5kaW5nVG90YWxzKCdjb21tdW5pY2F0aW9uQ29zdHMnKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIElmIHdlJ3JlIG9uIHRoZSByYWlzaW5nIHRhYiwgbG9hZCB0aGUgc3RhdGUgbWFwXG4gIGlmIChxdWVyeS50YWIgPT09ICdyYWlzaW5nJykge1xuICAgICQuZ2V0SlNPTihtYXBVcmwpLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgbWFwcy5zdGF0ZU1hcCgkbWFwLCBkYXRhLCA0MDAsIDMwMCwgbnVsbCwgbnVsbCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRoYXQgb25seSBmaXJlcyBvbmNlIG9uIHNob3dpbmcgdGhlIHJhaXNpbmcgdGFiXG4gICAgLy8gaW4gb3JkZXIgdG8gbm90IG1ha2UgdGhpcyBBUEkgY2FsbCB1bmxlc3MgaXRzIG5lY2Vzc2FyeVxuICAgIGV2ZW50cy5vbmNlKCd0YWJzLnNob3cucmFpc2luZycsIGZ1bmN0aW9uKCkge1xuICAgICAgJC5nZXRKU09OKG1hcFVybCkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIG1hcHMuc3RhdGVNYXAoJG1hcCwgZGF0YSwgNDAwLCAzMDAsIG51bGwsIG51bGwsIHRydWUsIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn0pO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9mZWMvc3RhdGljL2pzL3BhZ2VzL2NhbmRpZGF0ZS1zaW5nbGUuanNcbi8vIG1vZHVsZSBpZCA9IDMzOVxuLy8gbW9kdWxlIGNodW5rcyA9IDIwIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBnbG9iYWwgcmVxdWlyZSwgY29udGV4dCAqL1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9oZWxwZXJzJyk7XG5cbnZhciBwYXRoTWFwID0ge1xuICAnaW5kZXBlbmRlbnRFeHBlbmRpdHVyZXMnOiAnL3NjaGVkdWxlcy9zY2hlZHVsZV9lL2J5X2NhbmRpZGF0ZS8nLFxuICAnY29tbXVuaWNhdGlvbkNvc3RzJzogJy9jb21tdW5pY2F0aW9uX2Nvc3RzL2J5X2NhbmRpZGF0ZS8nLFxuICAnZWxlY3Rpb25lZXJpbmcnOiAnL2VsZWN0aW9uZWVyaW5nL2J5X2NhbmRpZGF0ZS8nXG59O1xuXG5mdW5jdGlvbiBPdGhlclNwZW5kaW5nVG90YWxzKHR5cGUpIHtcbiAgdGhpcy4kZWxtID0gJCgnLmpzLW90aGVyLXNwZW5kaW5nLXRvdGFsc1tkYXRhLXNwZW5kaW5nLXR5cGU9JysgdHlwZSArICddJyk7XG4gIHRoaXMudHlwZSA9IHR5cGU7XG4gIHRoaXMuZGF0YSA9IFtdO1xuICB0aGlzLmluaXQoKTtcbn1cblxuT3RoZXJTcGVuZGluZ1RvdGFscy5wcm90b3R5cGUuZmV0Y2hEYXRhID0gZnVuY3Rpb24ocGFnZSkge1xuICAvLyBGZXRjaCB0aGUgZGF0YSBmb3IgYSBnaXZlbiBwYWdlXG4gIC8vIFBhZ2UgaXMgcmVxdWlyZWQgYmVjYXVzZSBpZiB0aGVyZSdzIG1vcmUgdGhhbiAxMDAgcmVzdWx0cyB3ZSBuZWVkXG4gIC8vIHRvIGxvb3AgdGhyb3VnaCBhbGwgdGhlIHBhZ2VzXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIHVybCA9IGhlbHBlcnMuYnVpbGRVcmwoXG4gICAgcGF0aE1hcFt0aGlzLnR5cGVdLFxuICAgIHtcbiAgICAgIGNhbmRpZGF0ZV9pZDogY29udGV4dC5jYW5kaWRhdGVJRCxcbiAgICAgIGN5Y2xlOiBjb250ZXh0LmN5Y2xlLFxuICAgICAgZWxlY3Rpb25fZnVsbDogY29udGV4dC5lbGVjdGlvbkZ1bGwsXG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgcGVyX3BhZ2U6IDEwMFxuICAgIH1cbiAgKTtcblxuICAkLmdldEpTT04odXJsKS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgY3VycmVudFBhZ2UgPSBkYXRhLnBhZ2luYXRpb24ucGFnZTtcbiAgICBpZiAoZGF0YS5yZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gSWYgbm8gcmVzdWx0cywgcmVtb3ZlIHRoZSBjb21wb25lbnRcbiAgICAgIHNlbGYuJGVsbS5yZW1vdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWRkIHRoZSByZXN1bHRzIHRvIHRoZSBleGlzdGluZyBkYXRhIGFycmF5XG4gICAgICBzZWxmLmRhdGEgPSBzZWxmLmRhdGEuY29uY2F0KGRhdGEucmVzdWx0cyk7XG4gICAgICBpZiAoY3VycmVudFBhZ2UgPT09IGRhdGEucGFnaW5hdGlvbi5wYWdlcykge1xuICAgICAgICAvLyBJZiB3ZSdyZSBvbiB0aGUgbGFzdCBwYWdlLCBzaG93IHRoZSB0b3RhbHNcbiAgICAgICAgc2VsZi5zaG93VG90YWxzKHNlbGYuZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UgZmV0Y2ggZGF0YSBmb3IgdGhlIG5leHQgcGFnZVxuICAgICAgICB2YXIgbmV4dFBhZ2UgPSBjdXJyZW50UGFnZSArIDE7XG4gICAgICAgIHNlbGYuZmV0Y2hEYXRhKG5leHRQYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuT3RoZXJTcGVuZGluZ1RvdGFscy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmZldGNoRGF0YSgpO1xufTtcblxuT3RoZXJTcGVuZGluZ1RvdGFscy5wcm90b3R5cGUuc2hvd1RvdGFscyA9IGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgaWYgKHRoaXMudHlwZSA9PT0gJ2VsZWN0aW9uZWVyaW5nJykge1xuICAgIC8vIEVsZWN0aW9uZWVyaW5nIGNvbW1zIGFyZW4ndCBtYXJrZWQgYXMgc3VwcG9ydCBvciBvcHBvc2UsIHNvIGp1c3QgYWRkXG4gICAgLy8gdGhlbSBhbGwgdG9nZXRoZXJcbiAgICB2YXIgdG90YWwgPSBfLnJlZHVjZShyZXN1bHRzLCBmdW5jdGlvbihtZW1vLCBkYXR1bSkge1xuICAgICAgICByZXR1cm4gIG1lbW8gKyBkYXR1bS50b3RhbDtcbiAgICAgIH0sIDApO1xuICAgICAgdGhpcy4kZWxtLmZpbmQoJy5qcy10b3RhbC1lbGVjdGlvbmVlcmluZycpLmh0bWwoaGVscGVycy5jdXJyZW5jeSh0b3RhbCkpO1xuICB9IGVsc2Uge1xuICAgIC8vIEdldCBzdXBwb3J0IGFuZCBvcHBvc2UgdG90YWxzIGJ5IGZpbHRlcmluZyByZXN1bHRzIGJ5IHRoZSBjb3JyZWN0IGluZGljYXRvclxuICAgIC8vIGFuZCB0aGVuIHJ1bm5pbmcgXy5yZWR1Y2UgdG8gYWRkIGFsbCB0aGUgdmFsdWVzXG4gICAgdmFyIHN1cHBvcnRUb3RhbCA9IF8uY2hhaW4ocmVzdWx0cylcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnN1cHBvcnRfb3Bwb3NlX2luZGljYXRvciA9PT0gJ1MnO1xuICAgICAgfSlcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24obWVtbywgZGF0dW0pIHtcbiAgICAgICAgcmV0dXJuICBtZW1vICsgZGF0dW0udG90YWw7XG4gICAgICB9LCAwKVxuICAgICAgLnZhbHVlKCk7XG5cbiAgICB2YXIgb3Bwb3NlVG90YWwgPSBfLmNoYWluKHJlc3VsdHMpXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5zdXBwb3J0X29wcG9zZV9pbmRpY2F0b3IgPT09ICdPJztcbiAgICAgIH0pXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIGRhdHVtKSB7XG4gICAgICAgIHJldHVybiAgbWVtbyArIGRhdHVtLnRvdGFsO1xuICAgICAgfSwgMClcbiAgICAgIC52YWx1ZSgpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBET00gd2l0aCB0aGUgdmFsdWVzXG4gICAgdGhpcy4kZWxtLmZpbmQoJy5qcy1zdXBwb3J0JykuaHRtbChoZWxwZXJzLmN1cnJlbmN5KHN1cHBvcnRUb3RhbCkpO1xuICAgIHRoaXMuJGVsbS5maW5kKCcuanMtb3Bwb3NlJykuaHRtbChoZWxwZXJzLmN1cnJlbmN5KG9wcG9zZVRvdGFsKSk7XG5cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBPdGhlclNwZW5kaW5nVG90YWxzO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9mZWMvc3RhdGljL2pzL21vZHVsZXMvb3RoZXItc3BlbmRpbmctdG90YWxzLmpzXG4vLyBtb2R1bGUgaWQgPSAzNDBcbi8vIG1vZHVsZSBjaHVua3MgPSAyMCJdLCJzb3VyY2VSb290IjoiIn0=