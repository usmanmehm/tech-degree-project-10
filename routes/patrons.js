const express = require('express');
const router = express.Router();

const Patrons = require('../models').Patrons;
const Loans = require('../models').Loans;
const Books = require('../models').Books;

// Create association
Patrons.hasMany(Loans, { foreignKey: 'patron_id' });

const query = {
    attributes: ["id", "first_name", "last_name", "address", "email", "library_id", "zip_code"]
}

const detailsQuery = {
    attributes: query.attributes,
    include: {
        model: Loans, attributes: ["id", "book_id", "patron_id", "loaned_on", "return_by", "returned_on"],
        include: { model: Books, attributes: ["title"]}
    }
}

router.get('/', function(req, res, next) {
    const page = req.query.page ? req.query.page : 1;
    const numPerPage = 10;
    const offset = (page - 1) * numPerPage;
    let totalPatrons;
    query.offset = offset;
    query.limit = numPerPage;
    Patrons.findAll().then( patrons => {
        totalPatrons = patrons.length;
    }).then( () => {
        Patrons.findAll(query).then( patrons => {
        res.render('patrons', { patrons, currentPage: page, numPerPage, totalPatrons});
      })
    });
});

// New Patron
router.get('/new', function(req, res, next) {
    res.render('new-patron', { patron: Patrons.build() });
});

router.post('/', (req, res, next) => {
    Patrons.create(req.body).then( () => {
        res.redirect('patrons');
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                firstName: {
                    msg: filterErrorMessage("first name", errorMessages)
                },
                lastName: {
                    msg: filterErrorMessage("last name", errorMessages)
                },
                address: {
                    msg: filterErrorMessage("address", errorMessages)
                },
                email: {
                    msg: filterErrorMessage("email", errorMessages)
                },
                library: {
                    msg: filterErrorMessage("Library", errorMessages)
                },
                zip: {
                    msg: filterErrorMessage("zip", errorMessages)
                }
            }
            res.render("new-patron", { patron: Patrons.build(req.body), errors });
        }
        else throw err;
    }).catch( err => {
        res.sendStatus(500);
    })
})

// Patron Details
let patronDetails;
router.get('/details/:id', function(req, res, next) {
    const id = req.params.id;
    Patrons.findById(id, detailsQuery).then ( patron => {
        patronDetails = patron;
        res.render('patron-details', { patron });
    });
});
// Update patron details
router.put('/details/:id', (req, res) => {
    Patrons.findByPk(req.params.id, detailsQuery).then( patron => {
        if (patron) {
            return patron.update(req.body);
        }
        else res.sendStatus(404);
    }).then( () => {
        res.redirect('/patrons');
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                firstName: {
                    msg: filterErrorMessage("first name", errorMessages)
                },
                lastName: {
                    msg: filterErrorMessage("last name", errorMessages)
                },
                address: {
                    msg: filterErrorMessage("address", errorMessages)
                },
                email: {
                    msg: filterErrorMessage("email", errorMessages)
                },
                library: {
                    msg: filterErrorMessage("Library", errorMessages)
                },
                zip: {
                    msg: filterErrorMessage("zip", errorMessages)
                }
            }
            res.render('patron-details', { patron: patronDetails, errors })
        }
    })
})

router.get('/delete/:id', (req, res) => {
    Patrons.findByPk(req.params.id).then( patron => {
        res.render('delete-patron', { patron });
    })
})

router.put('/delete/:id', (req, res) => {
    Loans.findAll( { where: { patron_id: req.params.id }} ).then( loans => {
        loans.map( loan => {
            loan.destroy( { force: true });
        })
    }).then( () => {
        Patrons.findByPk(req.params.id).then( patron => {
            return patron.destroy( { force: true });
        }).then( () => {
        res.redirect('/patrons');
        })
    });
})

const filterErrorMessage = (type, messages) => {
    messages = messages.filter( message => {
        return message.indexOf(type) > -1;
    });

    return messages.map (message => {
        const endOfString = message[message.length - 1];
        if (endOfString === "\n") {
            return message.substr(0, message.length - 2);
        }
        return message;
    })
};

module.exports = router;