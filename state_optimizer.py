import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from itertools import product
from math import exp, factorial

MAX_SUPPLIES = 20  # maximum #supplies in a location
MOVE_COST = 2  # cost for moving a supply
RENTAL_REWARD = 10  # reward from one rented supply
AVG_RENTAL_1 = 5  # average #rentals at location 1
AVG_RENTAL_2 = 9  # average #rentals at location 2
AVG_RETURN_1 = 0  # average #returns at location 1
AVG_RETURN_2 = 0  # average #returns at location 2
DISCOUNT = 0.9

'''
Poisson distribution for X<k
(Poisson(X>=k) is small enough to be ignored)
-- poisson = dict: lambda_value -> list of (x, probabilities
'''
poisson = {}
k = 30


def poisson_prob(lmbda, x):
    return exp(-lmbda)*pow(lmbda, x)/factorial(x)


# populate poisson
for lmbda in [AVG_RENTAL_1, AVG_RENTAL_2, AVG_RETURN_1, AVG_RETURN_2]:
    poisson[lmbda] = [poisson_prob(lmbda, x) for x in range(k)]


'''
A state is a tuple (#supplies in location 1)x(#supplies in location 2)
-- states = list of states
'''
states = list(product(range(MAX_SUPPLIES+1), repeat=2))

'''
An action, n, is the number of supplies moved from location 1 to location 2
(negative means to move supplies from location 2 to location 1)
The possible set of actions for a state
is the intersection of [-n2..n1] and [-5..5],
where n1, n2 are the #supplies in location 1 and location 2, respectively
-- actions = dict: state -> list of actions
'''
actions = dict(((n1, n2), list(range(max(-5, -n2), min(n1, 5)+1)))
               for n1, n2 in states)

'''
Probabilities of getting into a new state
after an action from some state
-- transitions = dict: state -> action -> state -> probability 
'''
transitions = {}

'''
Expected rewards after taking an action from some state
-- rewards = dict: state -> action -> reward
'''
rewards = {}

'''
Calculate
 - expected rewards from rental, and
 - probability distribution of supplies left
after a day of business starting with num_supplies supplies
'''


def expected_day(num_supplies, avg_rental, avg_return):
    pd = poisson[avg_rental]
    rewards = 0
    supplies_left_probs = [0]*(MAX_SUPPLIES+1)
    for x, xprob in enumerate(poisson[avg_rental]):
        rental = min(x, num_supplies)
        rewards += RENTAL_REWARD*rental*xprob
        for y, yprob in enumerate(poisson[avg_return]):
            supplies_left = min(num_supplies-rental+y, MAX_SUPPLIES)
            supplies_left_probs[supplies_left] += xprob*yprob
    return (rewards, supplies_left_probs)


# populate transitions, and rewards
for s in states:
    n1, n2 = s
    rewards[s] = {}
    transitions[s] = {}
    for a in actions[s]:  # for each possible action at state
        c1, c2 = n1-a, n2+a  # number of supplies after moving supplies

        exp_rwd1, supply_probs1 = expected_day(c1, AVG_RENTAL_1, AVG_RETURN_1)
        exp_rwd2, supply_probs2 = expected_day(c2, AVG_RENTAL_2, AVG_RETURN_2)

        rewards[s][a] = exp_rwd1 + exp_rwd2 - MOVE_COST*abs(a)
        transitions[s][a] = {}
        for supplies1, prob1 in enumerate(supply_probs1):
            for supplies2, prob2 in enumerate(supply_probs2):
                transitions[s][a][supplies1, supplies2] = prob1*prob2

'''
Since all states have action 0 (move no supply),
we can start off with this do-nothing policy
-- policy = dict: state -> action
'''
init_policy = dict(zip(states, [0]*len(states)))

'''
State values
Start with all-zero
-- values = dict: state -> value
'''
init_values = dict(zip(states, [0]*len(states)))


'''
Compue state values given a policy
through iterative policy evaluation
'''


def eval_policy(values, policy):
    converged = False
    while not converged:

        # synchronous backup
        new_values = {}
        for s in states:
            action = policy[s]
            new_values[s] = rewards[s][action]
            for ns in states:
                new_values[s] += DISCOUNT*transitions[s][action][ns]*values[ns]

        max_diff = max(abs(values[s]-new_values[s]) for s in states)
        values = new_values
        converged = max_diff < 0.001
    return new_values


'''
Compute policy with respect to state values
'''


def greedy(values):
    policy = {}
    for s in states:
        max_q = -10000
        for a in actions[s]:
            q = rewards[s][a]
            q += sum(DISCOUNT*transitions[s][a]
                     [ns]*values[ns] for ns in states)
            if q > max_q:
                best_action = a
                max_q = q
        policy[s] = best_action
    return policy


# policy iteration
values, policies = [init_values], [init_policy]
converged = False
iter_count = 0
while not converged:
    values.append(eval_policy(values[-1], policies[-1]))
    policies.append(greedy(values[-1]))
    converged = all(policies[-1] == policies[-2] for s in states)
    iter_count += 1

print('Number of iterations: %d' % iter_count)


for step in range(iter_count):
    # policy
    dim = MAX_SUPPLIES+1
    data = [[0]*dim for x in range(dim)]
    for x, y in states:
        data[x][y] = policies[step][x, y]

    # values
    X, Y = zip(*states)
    Z = [values[step][x, y] for x, y in zip(X, Y)]

    if not step < iter_count - 1:
        fig = plt.figure(figsize=(15, 6))

        ax = fig.add_subplot(121)
        ax.matshow(data[::-1], cmap=plt.cm.bwr, vmin=-5, vmax=5)
        ax.set_xticks(range(dim))
        ax.set_yticks(range(dim))
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.set_xticks([x-0.5 for x in range(1, dim)], minor=True)
        ax.set_xlabel('Number of supplies in store B')
        ax.set_yticks([y-0.5 for y in range(1, dim)], minor=True)
        ax.set_ylabel('Number of supplies in store A')
        ax.set_title('Optimal supply distribution strategy.')
        for x, y in states:
            ax.text(y, x, data[::-1][x][y], va='center', ha='center')

        ax = fig.add_subplot(122, projection='3d')
        ax.scatter3D(X, Y, Z)
        ax.set_xlim3d(0, MAX_SUPPLIES)
        ax.set_ylim3d(0, MAX_SUPPLIES)
        ax.set_title('Expected Reward Matrix', fontsize=25)

        plt.show()

current_A = 3
current_B = 3

if data[current_A][current_B] < 0:
    outcome = f'Move {abs(data[current_A][current_B])} from Location B to Location A'
elif data[current_A][current_B] == 0:
    outcome = "Current allocation of supplies is optimal."
else:
    outcome = f'Move {data[current_A][current_B]} from Location A to Location B'


print(
    f'Optimal redistribution of supplies given {current_A} supplies in Location A and {current_B} supplies in Location B:')
print(outcome)
